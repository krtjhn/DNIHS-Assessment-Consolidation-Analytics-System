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

// Manages assessment score sheets, statistics calculation, and report consolidation
class AssessmentController extends Controller
{
    public function __construct(
        protected StatsCalculatorService $statsCalculator // Inject statistical calculation service
    ) {}

    // Get the classes and subjects assigned to the logged-in teacher for the active school year
    public function myClasses(Request $request): JsonResponse
    {
        $schoolYearId = $request->input('school_year_id'); // Optional school year filter
        if (! $schoolYearId) {
            $activeSY = \App\Models\SchoolYear::active()->first(); // Resolve active school year
            $schoolYearId = $activeSY?->id; // Fallback to active year id
        }

        $userId = $request->user()->id; // Logged-in teacher ID
        $cacheKey = "teacher_classes_{$userId}_{$schoolYearId}"; // Cache key per teacher and year

        // Cache the teaching schedule for 5 minutes to avoid repeating queries
        $assignments = Cache::store('file')->remember($cacheKey, 300, function () use ($userId, $schoolYearId) {
            $query = TeachingAssignment::with(['section.gradeLevel', 'subject', 'schoolYear']) // Eager load relations
                ->where('user_id', $userId) // Restrict to current teacher
                ->active(); // Scope to active assignments

            if ($schoolYearId) {
                $query->where('school_year_id', $schoolYearId); // Filter by school year
            }

            return $query->get()->toArray(); // Convert collection to array
        });

        return response()->json([
            'data' => $assignments, // Return teaching assignments array
        ]);
    }

    // List assessment records with optional filters
    public function index(Request $request): JsonResponse
    {
        $query = AssessmentRecord::with(['teacher', 'section', 'subject', 'gradeLevel', 'term', 'schoolYear']) // Eager load relations
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->school_year_id)) // Filter school year
            ->when($request->filled('term_id'), fn ($q) => $q->where('term_id', $request->term_id)) // Filter term
            ->when($request->filled('section_id'), fn ($q) => $q->where('section_id', $request->section_id)) // Filter section
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->subject_id)) // Filter subject
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type)); // Filter type

        // Teachers only see their own records; administrators see records across all classes
        if ($request->user()->hasRole('teacher') && ! $request->user()->hasRole('system_admin')) {
            $query->where('teacher_id', $request->user()->id); // Enforce teacher ownership
        }

        $records = $query->orderBy('created_at', 'desc')->get(); // Sort newest first

        return response()->json([
            'data' => AssessmentRecordResource::collection($records), // Return formatted resource collection
        ]);
    }

    // Save student scores, calculate DepEd stats, and store the assessment record
    public function store(StoreAssessmentRequest $request): JsonResponse
    {
        $validated = $request->validated(); // Get validated payload
        $isAdmin = $request->user()->hasRole('system_admin'); // Check if requester is admin

        // Check if the school year and term are open and active
        $term = Term::with('schoolYear')->find($validated['term_id']); // Find requested term
        if (! $isAdmin && (! $term || ! $term->isOpen() || ($term->schoolYear && ! $term->schoolYear->is_active))) {
            return response()->json([
                'message' => 'The academic calendar term or school year is closed or inactive. Scores cannot be recorded.', // Closed term error
            ], 422);
        }

        // Make sure the section and subject belong to the same grade level
        $section = Section::find($validated['section_id']); // Find section model
        $subject = Subject::find($validated['subject_id']); // Find subject model
        if ($section && $subject && $section->grade_level_id !== $subject->grade_level_id) {
            return response()->json([
                'message' => 'Academic alignment error: The selected section and subject do not belong to the same grade level.', // Grade mismatch error
            ], 422);
        }

        // Verify that the teacher is officially assigned to teach this class
        if (! $isAdmin) {
            $isAssigned = TeachingAssignment::where([
                'user_id' => $request->user()->id, // Current teacher
                'school_year_id' => $validated['school_year_id'], // School year
                'section_id' => $validated['section_id'], // Section
                'subject_id' => $validated['subject_id'], // Subject
            ])->active()->exists(); // Check assignment exists

            if (! $isAssigned) {
                return response()->json([
                    'message' => 'You are not assigned to teach this class. Only assigned teachers or administrators can record scores.', // Forbidden message
                ], 403);
            }
        }

        $type = $validated['type']; // Resolve assessment milestone type
        $validated['type'] = $type; // Ensure type is present

        // Prevent a teacher from overwriting a score sheet already recorded by another teacher
        $existing = AssessmentRecord::where([
            'school_year_id' => $validated['school_year_id'], // Matching school year
            'term_id' => $validated['term_id'], // Matching term
            'section_id' => $validated['section_id'], // Matching section
            'subject_id' => $validated['subject_id'], // Matching subject
            'type' => $type, // Matching type
        ])->first(); // Search existing record

        if ($existing && ! $isAdmin && $existing->teacher_id !== $request->user()->id) {
            $existingTeacher = $existing->teacher?->name ?? 'another faculty member'; // Existing author name

            return response()->json([
                'message' => "This assessment was already recorded by {$existingTeacher}. You cannot overwrite another teacher's score sheet.", // Conflict message
            ], 403);
        }

        // Compute statistics and save the record in a database transaction
        $record = DB::transaction(function () use ($validated, $request, $type) {
            $stats = $this->statsCalculator->calculate(
                $validated['raw_scores'], // Raw scores array
                $validated['total_items'] // Test items count
            );

            // Clean up least learned competency text input
            $leastLearned = isset($validated['least_learned_competency']) ? trim((string) $validated['least_learned_competency']) : null; // Trim string
            $leastLearned = ($leastLearned === '' || $leastLearned === '-' || $leastLearned === '—') ? null : $leastLearned; // Treat dashes as null

            // Create or update the score record
            return AssessmentRecord::updateOrCreate(
                [
                    'school_year_id' => $validated['school_year_id'], // Unique key: school year
                    'term_id' => $validated['term_id'], // Unique key: term
                    'section_id' => $validated['section_id'], // Unique key: section
                    'subject_id' => $validated['subject_id'], // Unique key: subject
                    'type' => $type, // Unique key: type
                ],
                [
                    'grade_level_id' => $validated['grade_level_id'], // Grade level
                    'teacher_id' => $request->user()->id, // Recording teacher
                    'total_items' => $validated['total_items'], // Item count
                    'raw_scores' => array_values($validated['raw_scores']), // Indexed scores
                    'no_of_entries' => $stats['no_of_entries'], // Number of examinees
                    'mean' => $stats['mean'], // Computed mean
                    'mps' => $stats['mps'], // Computed MPS
                    'sd' => $stats['sd'], // Computed SD
                    'highest_score' => $stats['highest_score'], // Highest score
                    'lowest_score' => $stats['lowest_score'], // Lowest score
                    'least_learned_competency' => $leastLearned, // Weak competency
                    'remarks' => $validated['remarks'] ?? 'Complete', // Status remark
                ]
            );
        });

        return response()->json([
            'message' => 'Assessment scores encoded and calculated successfully.', // Success confirmation
            'data' => new AssessmentRecordResource($record->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])), // Formatted resource
        ], 201);
    }

    // View a single assessment record by ID
    public function show(Request $request, AssessmentRecord $assessment): JsonResponse
    {
        // Teachers cannot view another teacher's assessment record
        if ($request->user()->hasRole('teacher') && ! $request->user()->hasRole('system_admin') && $assessment->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => "You are not authorized to view another teacher's assessment record.", // Forbidden message
            ], 403);
        }

        return response()->json([
            'data' => new AssessmentRecordResource($assessment->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])), // Formatted resource
        ]);
    }

    // Update raw scores and recalculate statistics
    public function update(UpdateAssessmentRequest $request, AssessmentRecord $assessment): JsonResponse
    {
        $isAdmin = $request->user()->hasRole('system_admin'); // Check if requester is admin

        // Check ownership and calendar status for non-admin teachers
        if (! $isAdmin) {
            if ($assessment->teacher_id !== $request->user()->id) {
                return response()->json([
                    'message' => "You are not authorized to update another teacher's assessment record.", // Forbidden message
                ], 403);
            }

            if (! $assessment->term || ! $assessment->term->isOpen() || ($assessment->schoolYear && ! $assessment->schoolYear->is_active)) {
                return response()->json([
                    'message' => 'The academic calendar term or school year is closed. Historical score sheets cannot be modified.', // Closed calendar error
                ], 422);
            }
        }

        $validated = $request->validated(); // Get validated payload

        // Recalculate statistics and save changes in a transaction
        $assessment = DB::transaction(function () use ($validated, $assessment) {
            $stats = $this->statsCalculator->calculate(
                $validated['raw_scores'], // Updated scores
                $validated['total_items'] // Item count
            );

            $leastLearned = isset($validated['least_learned_competency']) ? trim((string) $validated['least_learned_competency']) : null; // Trim competency
            $leastLearned = ($leastLearned === '' || $leastLearned === '-' || $leastLearned === '—') ? null : $leastLearned; // Treat dashes as null

            $assessment->update([
                'total_items' => $validated['total_items'], // Item count
                'raw_scores' => array_values($validated['raw_scores']), // Indexed scores
                'no_of_entries' => $stats['no_of_entries'], // Number of examinees
                'mean' => $stats['mean'], // Recalculated mean
                'mps' => $stats['mps'], // Recalculated MPS
                'sd' => $stats['sd'], // Recalculated SD
                'highest_score' => $stats['highest_score'], // High score
                'lowest_score' => $stats['lowest_score'], // Low score
                'least_learned_competency' => $leastLearned, // Weak competency
                'remarks' => $validated['remarks'] ?? 'Complete', // Status remark
            ]);

            return $assessment; // Return updated model
        });

        return response()->json([
            'message' => 'Assessment scores updated and recalculated successfully.', // Success confirmation
            'data' => new AssessmentRecordResource($assessment->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])), // Formatted resource
        ]);
    }

    // Delete an assessment record
    public function destroy(Request $request, AssessmentRecord $assessment): JsonResponse
    {
        $isAdmin = $request->user()->hasRole('system_admin'); // Check if requester is admin

        // Non-admin teachers can only delete their own records during an open term
        if (! $isAdmin) {
            if ($assessment->teacher_id !== $request->user()->id) {
                return response()->json([
                    'message' => "You are not authorized to delete another teacher's assessment record.", // Forbidden message
                ], 403);
            }

            if (! $assessment->term || ! $assessment->term->isOpen() || ($assessment->schoolYear && ! $assessment->schoolYear->is_active)) {
                return response()->json([
                    'message' => 'The academic calendar term or school year is closed. Historical records cannot be deleted.', // Closed calendar error
                ], 422);
            }
        }

        $assessment->delete(); // Soft delete record

        return response()->json([
            'message' => 'Assessment record deleted successfully.', // Deletion confirmation
        ]);
    }

    // Generate consolidated report and statistics across sections
    public function consolidation(Request $request): JsonResponse
    {
        $request->validate([
            'school_year_id' => ['required', 'exists:school_years,id'], // Must exist in school_years table
            'term_id' => ['required', 'exists:terms,id'], // Must exist in terms table
            'type' => ['nullable', 'string', 'in:diagnostic,term_exam'], // Optional type filter
            'grade_level_id' => ['nullable', 'exists:grade_levels,id'], // Optional grade level filter
        ]);

        $type = $request->type; // Milestone type

        $query = AssessmentRecord::with(['gradeLevel', 'section', 'subject', 'teacher']) // Eager load relations
            ->where('school_year_id', $request->school_year_id) // Matching school year
            ->where('term_id', $request->term_id) // Matching term
            ->when($type, fn ($q) => $q->where('type', $type)) // Optional type filter
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->grade_level_id)); // Optional grade filter

        $records = $query->get(); // Retrieve collection

        return response()->json([
            'summary' => $this->statsCalculator->summarizeConsolidation($records), // Overall summary stats for the group
            'records' => AssessmentRecordResource::collection($records), // Individual section breakdown
        ]);
    }
}
