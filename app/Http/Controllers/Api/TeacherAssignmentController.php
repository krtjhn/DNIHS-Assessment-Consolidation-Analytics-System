<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeachingAssignments\StoreTeachingAssignmentRequest;
use App\Http\Requests\TeachingAssignments\SyncTeachingAssignmentRequest;
use App\Http\Resources\TeachingAssignmentResource;
use App\Models\SchoolYear;
use App\Models\TeachingAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherAssignmentController extends Controller
{
    /**
     * List the authenticated teacher's active assignments.
     * GET /api/my-assignments
     */
    public function myAssignments(Request $request): JsonResponse
    {
        $user = $request->user();
        $schoolYearId = $request->input('school_year_id');

        if (! $schoolYearId) {
            $activeSY = SchoolYear::active()->first();
            $schoolYearId = $activeSY?->id;
        }

        $query = TeachingAssignment::with(['section.gradeLevel', 'subject', 'schoolYear'])
            ->forTeacher($user->id)
            ->active();

        if ($schoolYearId) {
            $query->forSchoolYear((int) $schoolYearId);
        }

        return response()->json([
            'data' => TeachingAssignmentResource::collection($query->get()),
        ]);
    }

    /**
     * List all teaching assignments for administrators.
     * GET /api/teaching-assignments
     */
    public function index(Request $request): JsonResponse
    {
        $query = TeachingAssignment::with(['teacher', 'section.gradeLevel', 'subject', 'schoolYear'])
            ->active();

        if ($request->filled('school_year_id')) {
            $query->forSchoolYear((int) $request->school_year_id);
        }

        if ($request->filled('user_id')) {
            $query->forTeacher((int) $request->user_id);
        }

        return response()->json([
            'data' => TeachingAssignmentResource::collection($query->get()),
        ]);
    }

    /**
     * Assign a teacher to a section and subject.
     * POST /api/teaching-assignments (Admin only)
     */
    public function store(StoreTeachingAssignmentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $effectiveFrom = $validated['effective_from'] ?? now()->toDateString();

        $assignment = DB::transaction(function () use ($validated, $request, $effectiveFrom) {
            // End an existing active assignment for the same subject, section, and school year.
            TeachingAssignment::where('school_year_id', $validated['school_year_id'])
                ->where('section_id', $validated['section_id'])
                ->where('subject_id', $validated['subject_id'])
                ->active()
                ->update(['effective_until' => now()->toDateString()]);

            // Create the assignment.
            return TeachingAssignment::create([
                'user_id' => $validated['user_id'],
                'school_year_id' => $validated['school_year_id'],
                'section_id' => $validated['section_id'],
                'subject_id' => $validated['subject_id'],
                'effective_from' => $effectiveFrom,
                'assigned_by' => $request->user()->id,
            ]);
        });

        return response()->json([
            'message' => 'Teaching assignment created successfully.',
            'data' => new TeachingAssignmentResource($assignment->load(['teacher', 'section.gradeLevel', 'subject', 'schoolYear'])),
        ], 201);
    }

    /**
     * Deactivate / End a teaching assignment.
     * DELETE /api/teaching-assignments/{teaching_assignment} (Admin only)
     */
    public function destroy(TeachingAssignment $teaching_assignment): JsonResponse
    {
        $teaching_assignment->update([
            'effective_until' => now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Teaching assignment ended successfully.',
        ]);
    }

    /**
     * Bulk sync teaching loads for a teacher in a school year.
     * POST /api/teaching-assignments/sync (Admin only)
     */
    public function syncTeacher(SyncTeachingAssignmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $userId = $validated['user_id'];
        $schoolYearId = $validated['school_year_id'];
        $effectiveFrom = $validated['effective_from'] ?? now()->toDateString();
        $adminId = $request->user()->id;

        DB::transaction(function () use ($userId, $schoolYearId, $validated, $effectiveFrom, $adminId): void {
            $submittedPairs = collect($validated['assignments'])
                ->mapWithKeys(fn ($item) => [$item['section_id'].'-'.$item['subject_id'] => true])
                ->all();

            // Load all current active assignments for this teacher in this school year
            $currentAssignments = TeachingAssignment::forTeacher($userId)
                ->forSchoolYear($schoolYearId)
                ->active()
                ->get();

            $existingPairKeys = $currentAssignments
                ->mapWithKeys(fn ($a) => [$a->section_id.'-'.$a->subject_id => true])
                ->all();

            // End assignments that are no longer in the submitted list
            $toEnd = $currentAssignments->filter(
                fn ($a) => ! isset($submittedPairs[$a->section_id.'-'.$a->subject_id])
            );

            if ($toEnd->isNotEmpty()) {
                TeachingAssignment::whereIn('id', $toEnd->pluck('id'))
                    ->update(['effective_until' => now()->toDateString()]);
            }

            // Collect pairs that are new
            $newPairs = collect($validated['assignments'])
                ->filter(fn ($item) => ! isset($existingPairKeys[$item['section_id'].'-'.$item['subject_id']]));

            if ($newPairs->isEmpty()) {
                return;
            }

            // End any other teacher's active assignment for these pairs
            TeachingAssignment::where('school_year_id', $schoolYearId)
                ->where('user_id', '!=', $userId)
                ->active()
                ->where(function ($q) use ($newPairs) {
                    foreach ($newPairs as $item) {
                        $q->orWhere(function ($inner) use ($item) {
                            $inner->where('section_id', $item['section_id'])
                                ->where('subject_id', $item['subject_id']);
                        });
                    }
                })
                ->update(['effective_until' => now()->toDateString()]);

            // Bulk-insert new assignments
            $now = now()->toDateTimeString();
            $inserts = $newPairs->map(fn ($item) => [
                'user_id' => $userId,
                'school_year_id' => $schoolYearId,
                'section_id' => $item['section_id'],
                'subject_id' => $item['subject_id'],
                'effective_from' => $effectiveFrom,
                'assigned_by' => $adminId,
                'created_at' => $now,
                'updated_at' => $now,
            ])->values()->all();

            TeachingAssignment::insert($inserts);
        });

        return response()->json([
            'message' => 'Teaching assignments updated successfully.',
        ]);
    }
}
