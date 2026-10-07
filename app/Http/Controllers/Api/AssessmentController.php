<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
// + Assessment Requests mula sa subfolder
use App\Http\Requests\Assessments\StoreAssessmentRequest;
use App\Http\Requests\Assessments\UpdateAssessmentRequest;
use App\Http\Resources\AssessmentRecordResource;
use App\Models\AssessmentRecord;
use App\Models\TeachingAssignment;
use App\Services\StatsCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssessmentController extends Controller
{
    public function __construct(
        protected StatsCalculatorService $statsCalculator
    ) {}

    /**
     * List all classes assigned to the authenticated teacher.
     * GET /api/my-classes
     */
    public function myClasses(Request $request): JsonResponse
    {
        $assignments = TeachingAssignment::with(['section.gradeLevel', 'subject', 'schoolYear'])
            ->where('user_id', $request->user()->id)
            ->active()
            ->get();

        return response()->json([
            'data' => $assignments,
        ]);
    }

    /**
     * READ: List assessment records with filters.
     * GET /api/assessments
     */
    public function index(Request $request): JsonResponse
    {
        $query = AssessmentRecord::with(['teacher', 'section', 'subject', 'gradeLevel', 'term', 'schoolYear'])
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->school_year_id))
            ->when($request->filled('term_id'), fn ($q) => $q->where('term_id', $request->term_id))
            ->when($request->filled('section_id'), fn ($q) => $q->where('section_id', $request->section_id))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->subject_id))
            ->when($request->filled('type'), function ($q) use ($request) {
                $type = $request->type === 'term_exam' ? 'quarterly' : $request->type;
                $q->where('type', $type);
            });

        // Restrict teachers to their own records only
        if ($request->user()->hasRole('teacher') && ! $request->user()->hasRole('system_admin')) {
            $query->where('teacher_id', $request->user()->id);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => AssessmentRecordResource::collection($records),
        ]);
    }

    /**
     * CREATE / STORE: Encode raw scores and auto-calculate DepEd statistics.
     * POST /api/assessments
     */
    public function store(StoreAssessmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Check if an assessment already exists for this exact class and term
        $existing = AssessmentRecord::where([
            'school_year_id' => $validated['school_year_id'],
            'term_id' => $validated['term_id'],
            'section_id' => $validated['section_id'],
            'subject_id' => $validated['subject_id'],
            'type' => $validated['type'],
        ])->first();

        if ($existing && ! $request->user()->hasRole('system_admin') && $existing->teacher_id !== $request->user()->id) {
            $existingTeacher = $existing->teacher?->name ?? 'another faculty member';

            return response()->json([
                'message' => "This assessment was already recorded by {$existingTeacher}. You cannot overwrite another teacher's score sheet.",
            ], 403);
        }

        $record = DB::transaction(function () use ($validated, $request) {
            // 1. Run DepEd automated calculation
            $stats = $this->statsCalculator->calculate(
                $validated['raw_scores'],
                $validated['total_items']
            );

            // 2. Update existing or create new record
            return AssessmentRecord::updateOrCreate(
                [
                    'school_year_id' => $validated['school_year_id'],
                    'term_id' => $validated['term_id'],
                    'section_id' => $validated['section_id'],
                    'subject_id' => $validated['subject_id'],
                    'type' => $validated['type'],
                ],
                [
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
                    'least_learned_competency' => $validated['least_learned_competency'] ?? null,
                    'remarks' => $validated['remarks'] ?? 'Complete',
                ]
            );
        });

        return response()->json([
            'message' => 'Assessment scores encoded and calculated successfully.',
            'data' => new AssessmentRecordResource($record->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])),
        ], 201);
    }

    /**
     * READ: Show single assessment score sheet details.
     * GET /api/assessments/{assessment}
     */
    public function show(Request $request, AssessmentRecord $assessment): JsonResponse
    {
        if ($request->user()->hasRole('teacher') && ! $request->user()->hasRole('system_admin') && $assessment->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => "You are not authorized to view another teacher's assessment record.",
            ], 403);
        }

        return response()->json([
            'data' => new AssessmentRecordResource($assessment->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])),
        ]);
    }

    /**
     * UPDATE: Edit raw scores and recompute DepEd statistics.
     * PUT /api/assessments/{assessment}
     */
    public function update(UpdateAssessmentRequest $request, AssessmentRecord $assessment): JsonResponse
    {
        if (! $request->user()->hasRole('system_admin') && $assessment->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => "You are not authorized to update another teacher's assessment record.",
            ], 403);
        }

        $validated = $request->validated();

        $assessment = DB::transaction(function () use ($validated, $assessment) {
            $stats = $this->statsCalculator->calculate(
                $validated['raw_scores'],
                $validated['total_items']
            );

            $assessment->update([
                'total_items' => $validated['total_items'],
                'raw_scores' => array_values($validated['raw_scores']),
                'no_of_entries' => $stats['no_of_entries'],
                'mean' => $stats['mean'],
                'mps' => $stats['mps'],
                'sd' => $stats['sd'],
                'highest_score' => $stats['highest_score'],
                'lowest_score' => $stats['lowest_score'],
                'least_learned_competency' => $validated['least_learned_competency'] ?? null,
                'remarks' => $validated['remarks'] ?? 'Complete',
            ]);

            return $assessment;
        });

        return response()->json([
            'message' => 'Assessment scores updated and recalculated successfully.',
            'data' => new AssessmentRecordResource($assessment->load(['teacher', 'section', 'subject', 'gradeLevel', 'term'])),
        ]);
    }

    /**
     * DELETE: Delete assessment record.
     * DELETE /api/assessments/{assessment}
     */
    public function destroy(Request $request, AssessmentRecord $assessment): JsonResponse
    {
        if (! $request->user()->hasRole('system_admin') && $assessment->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => "You are not authorized to delete another teacher's assessment record.",
            ], 403);
        }

        $assessment->delete();

        return response()->json([
            'message' => 'Assessment record deleted successfully.',
        ]);
    }

    /**
     * CONSOLIDATION: Get consolidated assessment cohort metrics across sections.
     * GET /api/assessments/consolidation
     */
    public function consolidation(Request $request): JsonResponse
    {
        $request->validate([
            'school_year_id' => ['required', 'exists:school_years,id'],
            'term_id' => ['required', 'exists:terms,id'],
            'type' => ['nullable', 'string', 'in:diagnostic,term_exam,quarterly'],
            'grade_level_id' => ['nullable', 'exists:grade_levels,id'],
        ]);

        $type = $request->type;
        if ($type === 'term_exam') {
            $type = 'quarterly';
        }

        $query = AssessmentRecord::with(['gradeLevel', 'section', 'subject', 'teacher'])
            ->where('school_year_id', $request->school_year_id)
            ->where('term_id', $request->term_id)
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->grade_level_id));

        $records = $query->get();

        return response()->json([
            'summary' => $this->statsCalculator->summarizeConsolidation($records),
            'records' => AssessmentRecordResource::collection($records),
        ]);
    }
}
