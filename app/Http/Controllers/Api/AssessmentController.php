<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assessments\StoreAssessmentRequest;
use App\Http\Requests\Assessments\UpdateAssessmentRequest;
use App\Http\Resources\AssessmentRecordResource;
use App\Models\AssessmentRecord;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeachingAssignment;
use App\Models\Term;
use App\Services\StatsCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// Primary API Controller managing student assessment score encoding, recalculation, ownership validation, and cohort consolidation
class AssessmentController extends Controller
{
    // Inject statistical calculation service via constructor promotion
    public function __construct(
        protected StatsCalculatorService $statsCalculator
    ) {}

    // Retrieve all active teaching assignments and classes allocated to the authenticated teacher for active school year
    public function myClasses(Request $request): JsonResponse
    {
        $schoolYearId = $request->input('school_year_id');
        if (! $schoolYearId) {
            $activeSY = \App\Models\SchoolYear::active()->first();
            $schoolYearId = $activeSY?->id;
        }

        $userId = $request->user()->id;
        $cacheKey = "teacher_classes_{$userId}_{$schoolYearId}";

        // Fast disk cache for teaching assignments to avoid repeating 5 relational queries
        $assignments = Cache::store('file')->remember($cacheKey, 300, function () use ($userId, $schoolYearId) {
            $query = TeachingAssignment::with(['section.gradeLevel', 'subject', 'schoolYear'])
                ->where('user_id', $userId)
                ->active();

            if ($schoolYearId) {
                $query->where('school_year_id', $schoolYearId);
            }

            return $query->get()->toArray();
        });

        // Return the teacher's active teaching workload schedule as a JSON response
        return response()->json([
            'data' => $assignments,
        ]);
    }

    // List assessment records filtered by academic year, term, section, subject, and assessment type
    public function index(Request $request): JsonResponse
    {
        // Construct Eloquent query with eager-loaded relations to prevent N+1 performance bottlenecks
        $query = AssessmentRecord::with(['teacher', 'section', 'subject', 'gradeLevel', 'term', 'schoolYear'])
            // Filter by school year if present in request parameters
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->school_year_id))
            // Filter by academic term if specified
            ->when($request->filled('term_id'), fn ($q) => $q->where('term_id', $request->term_id))
            // Filter by section if specified
            ->when($request->filled('section_id'), fn ($q) => $q->where('section_id', $request->section_id))
            // Filter by subject curriculum area if specified
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->subject_id))
            // Filter by assessment type (diagnostic or term_exam)
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type));

        // Role-based data access: Regular teachers only see their own score sheets; administrators see all school-wide records
        if ($request->user()->hasRole('teacher') && ! $request->user()->hasRole('system_admin')) {
            $query->where('teacher_id', $request->user()->id);
        }

        // Execute query ordered chronologically by newest records first
        $records = $query->orderBy('created_at', 'desc')->get();

        // Return structured JSON collection transformed through AssessmentRecordResource
        return response()->json([
            'data' => AssessmentRecordResource::collection($records),
        ]);
    }

    // Encode a new student assessment score sheet, compute DepEd statistics, and save to database
    public function store(StoreAssessmentRequest $request): JsonResponse
    {
        // Extract validated request data from StoreAssessmentRequest
        $validated = $request->validated();
        // Check if the current authenticated user has administrator privileges
        $isAdmin = $request->user()->hasRole('system_admin');

        // Step 1: Academic calendar lockout safeguard - verify term and school year are currently active and open
        $term = Term::with('schoolYear')->find($validated['term_id']);
        if (! $isAdmin && (! $term || ! $term->isOpen() || ($term->schoolYear && ! $term->schoolYear->is_active))) {
            return response()->json([
                'message' => 'The academic calendar term or school year is closed or inactive. Scores cannot be recorded.',
            ], 422);
        }

        // Step 1.5: Relational integrity safeguard - ensure section and subject match the designated grade level
        $section = Section::find($validated['section_id']);
        $subject = Subject::find($validated['subject_id']);
        if ($section && $subject && $section->grade_level_id !== $subject->grade_level_id) {
            return response()->json([
                'message' => 'Academic alignment error: The selected section and subject do not belong to the same grade level.',
            ], 422);
        }

        // Step 2: Workload authorization verification - ensure non-admin teacher is assigned to this section and subject
        if (! $isAdmin) {
            $isAssigned = TeachingAssignment::where([
                'user_id' => $request->user()->id,
                'school_year_id' => $validated['school_year_id'],
                'section_id' => $validated['section_id'],
                'subject_id' => $validated['subject_id'],
            ])->active()->exists();

            // Reject request with 403 Forbidden if teacher attempts to encode scores for an unassigned class
            if (! $isAssigned) {
                return response()->json([
                    'message' => 'You are not assigned to teach this class. Only assigned teachers or administrators can record scores.',
                ], 403);
            }
        }

        // Step 2.5: Normalize assessment type (diagnostic or term_exam)
        $type = $validated['type'] === 'diagnostic' ? 'diagnostic' : 'term_exam';
        $validated['type'] = $type;

        // Step 3: Anti-overwrite protection - check if another faculty member has already recorded this exact score sheet
        $existing = AssessmentRecord::where([
            'school_year_id' => $validated['school_year_id'],
            'term_id' => $validated['term_id'],
            'section_id' => $validated['section_id'],
            'subject_id' => $validated['subject_id'],
            'type' => $type,
        ])->first();

        // Prevent a teacher from modifying another teacher's existing score sheet
        if ($existing && ! $isAdmin && $existing->teacher_id !== $request->user()->id) {
            $existingTeacher = $existing->teacher?->name ?? 'another faculty member';

            return response()->json([
                'message' => "This assessment was already recorded by {$existingTeacher}. You cannot overwrite another teacher's score sheet.",
            ], 403);
        }

        // Step 4: Perform statistical computations and persist assessment record inside a database transaction
        $record = DB::transaction(function () use ($validated, $request, $type) {
            // Compute arithmetic mean, Mean Percentage Score (MPS), standard deviation, and mastery level via StatsCalculatorService
            $stats = $this->statsCalculator->calculate(
                $validated['raw_scores'],
                $validated['total_items']
            );

            // Sanitize least learned competency text input
            $leastLearned = isset($validated['least_learned_competency']) ? trim((string) $validated['least_learned_competency']) : null;
            $leastLearned = ($leastLearned === '' || $leastLearned === '-' || $leastLearned === '—') ? null : $leastLearned;

            // Upsert the assessment record based on unique composite key
            return AssessmentRecord::updateOrCreate(
                [
                    // Composite unique key attributes
                    'school_year_id' => $validated['school_year_id'],
                    'term_id' => $validated['term_id'],
                    'section_id' => $validated['section_id'],
                    'subject_id' => $validated['subject_id'],
                    'type' => $type,
                ],
                [
                    // Associated academic details and computed statistics
                    'grade_level_id' => $validated['grade_level_id'],
                    'teacher_id' => $request->user()->id,
                    'total_items' => $validated['total_items'],
                    'raw_scores' => array_values($validated['raw_scores']),
                    'no_of_entries' => $stats['no_of_entries'],
                    'mean' => $stats['mean'],
                    'mps' => $stats['mps'],
                    'sd' => $stats['sd'],
                    'highest_score' => $stats['highest_score'],
                    'lowest_score' => $stats['lowest_score'],
                    'least_learned_competency' => $leastLearned,
                    'remarks' => $validated['remarks'] ?? 'Complete',
                ]
            );
        });

        // Return 201 Created response containing the newly created assessment resource
        return response()->json([
            'message' => 'Assessment scores encoded and calculated successfully.',
            'data' => new AssessmentRecordResource($record->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])),
        ], 201);
    }

    // Retrieve a single assessment record by ID with full relationship data
    public function show(Request $request, AssessmentRecord $assessment): JsonResponse
    {
        // Enforce ownership safeguard: regular teachers cannot inspect assessment records belonging to peer teachers
        if ($request->user()->hasRole('teacher') && ! $request->user()->hasRole('system_admin') && $assessment->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => "You are not authorized to view another teacher's assessment record.",
            ], 403);
        }

        // Return the single assessment record formatted through AssessmentRecordResource
        return response()->json([
            'data' => new AssessmentRecordResource($assessment->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])),
        ]);
    }

    // Update raw student examination scores and recalculate statistical metrics
    public function update(UpdateAssessmentRequest $request, AssessmentRecord $assessment): JsonResponse
    {
        // Identify administrative privileges
        $isAdmin = $request->user()->hasRole('system_admin');

        // Non-admin teacher constraints: verify ownership and active calendar status
        if (! $isAdmin) {
            // Block modification if assessment belongs to another faculty member
            if ($assessment->teacher_id !== $request->user()->id) {
                return response()->json([
                    'message' => "You are not authorized to update another teacher's assessment record.",
                ], 403);
            }

            // Block modification if the academic calendar term or school year is closed/locked
            if (! $assessment->term || ! $assessment->term->isOpen() || ($assessment->schoolYear && ! $assessment->schoolYear->is_active)) {
                return response()->json([
                    'message' => 'The academic calendar term or school year is closed. Historical score sheets cannot be modified.',
                ], 422);
            }
        }

        // Retrieve validated request data from UpdateAssessmentRequest
        $validated = $request->validated();

        // Recalculate statistical metrics and save within a database transaction
        $assessment = DB::transaction(function () use ($validated, $assessment) {
            // Compute updated arithmetic mean, MPS, and population standard deviation
            $stats = $this->statsCalculator->calculate(
                $validated['raw_scores'],
                $validated['total_items']
            );

            // Sanitize least learned competency text input
            $leastLearned = isset($validated['least_learned_competency']) ? trim((string) $validated['least_learned_competency']) : null;
            $leastLearned = ($leastLearned === '' || $leastLearned === '-' || $leastLearned === '—') ? null : $leastLearned;

            // Update database attributes with newly recalculated statistics
            $assessment->update([
                'total_items' => $validated['total_items'],
                'raw_scores' => array_values($validated['raw_scores']),
                'no_of_entries' => $stats['no_of_entries'],
                'mean' => $stats['mean'],
                'mps' => $stats['mps'],
                'sd' => $stats['sd'],
                'highest_score' => $stats['highest_score'],
                'lowest_score' => $stats['lowest_score'],
                'least_learned_competency' => $leastLearned,
                'remarks' => $validated['remarks'] ?? 'Complete',
            ]);

            return $assessment;
        });

        // Return success response with updated assessment resource
        return response()->json([
            'message' => 'Assessment scores updated and recalculated successfully.',
            'data' => new AssessmentRecordResource($assessment->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])),
        ]);
    }

    // Delete an assessment record with academic calendar and ownership safeguards
    public function destroy(Request $request, AssessmentRecord $assessment): JsonResponse
    {
        // Identify administrative privileges
        $isAdmin = $request->user()->hasRole('system_admin');

        // Non-admin teacher safeguards
        if (! $isAdmin) {
            // Reject deletion if assessment was created by another teacher
            if ($assessment->teacher_id !== $request->user()->id) {
                return response()->json([
                    'message' => "You are not authorized to delete another teacher's assessment record.",
                ], 403);
            }

            // Reject deletion if the academic calendar term or school year is closed
            if (! $assessment->term || ! $assessment->term->isOpen() || ($assessment->schoolYear && ! $assessment->schoolYear->is_active)) {
                return response()->json([
                    'message' => 'The academic calendar term or school year is closed. Historical records cannot be deleted.',
                ], 422);
            }
        }

        // Delete the assessment record from the database
        $assessment->delete();

        // Return success message confirming deletion
        return response()->json([
            'message' => 'Assessment record deleted successfully.',
        ]);
    }

    // Compute consolidated cohort statistics across multiple sections for reporting and analytics
    public function consolidation(Request $request): JsonResponse
    {
        // Validate incoming filter parameters
        $request->validate([
            'school_year_id' => ['required', 'exists:school_years,id'],
            'term_id' => ['required', 'exists:terms,id'],
            'type' => ['nullable', 'string', 'in:diagnostic,term_exam'],
            'grade_level_id' => ['nullable', 'exists:grade_levels,id'],
        ]);

        // Filter by assessment type
        $type = $request->type;

        // Build query matching the selected school year, term, assessment type, and grade level
        $query = AssessmentRecord::with(['gradeLevel', 'section', 'subject', 'teacher'])
            ->where('school_year_id', $request->school_year_id)
            ->where('term_id', $request->term_id)
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->grade_level_id));

        // Retrieve matched assessment records
        $records = $query->get();

        // Return combined JSON containing mathematically pooled summary metrics and individual section records
        return response()->json([
            // Compute cohort statistics using pooled variance and weighted mean
            'summary' => $this->statsCalculator->summarizeConsolidation($records),
            // Individual section assessment records for tabular breakdown
            'records' => AssessmentRecordResource::collection($records),
        ]);
    }
}
