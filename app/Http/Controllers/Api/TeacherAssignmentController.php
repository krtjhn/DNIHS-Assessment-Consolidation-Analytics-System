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

// Teacher Assignment Controller managing faculty class assignments, workload collision detection, and batch matrix synchronization
class TeacherAssignmentController extends Controller
{
    // Retrieve active teaching assignments assigned to the authenticated faculty member
    public function myAssignments(Request $request): JsonResponse
    {
        // Extract authenticated teacher user object
        $user = $request->user();
        // Read optional school_year_id filter from query parameters
        $schoolYearId = $request->input('school_year_id');

        // Fallback: If no school year parameter was passed, resolve the currently active academic calendar year
        if (! $schoolYearId) {
            $activeSY = SchoolYear::active()->first();
            $schoolYearId = $activeSY?->id;
        }

        // Query teaching assignments belonging to this teacher with eager-loaded section, grade level, subject, and school year
        $query = TeachingAssignment::with(['section.gradeLevel', 'subject', 'schoolYear'])
            // Scope query to the logged-in teacher's user ID
            ->forTeacher($user->id)
            // Filter only active assignments where effective_until is null or future
            ->active();

        // Scope to specific school year if resolved
        if ($schoolYearId) {
            $query->forSchoolYear((int) $schoolYearId);
        }

        // Return structured collection transformed through TeachingAssignmentResource
        return response()->json([
            'data' => TeachingAssignmentResource::collection($query->get()),
        ]);
    }

    // List all active teaching assignments across the school for administrator review
    public function index(Request $request): JsonResponse
    {
        // Query all active teaching assignments with complete relational details
        $query = TeachingAssignment::with(['teacher', 'section.gradeLevel', 'subject', 'schoolYear'])
            ->active();

        // Filter assignments by school year when requested
        if ($request->filled('school_year_id')) {
            $query->forSchoolYear((int) $request->school_year_id);
        }

        // Filter assignments by specific teacher ID when requested
        if ($request->filled('user_id')) {
            $query->forTeacher((int) $request->user_id);
        }

        // Return collection of active assignments
        return response()->json([
            'data' => TeachingAssignmentResource::collection($query->get()),
        ]);
    }

    // Allocate an individual class workload (section and subject) to a designated faculty member
    public function store(StoreTeachingAssignmentRequest $request): JsonResponse
    {
        // Extract validated assignment data
        $validated = $request->validated();
        // Determine assignment effective start date, defaulting to today's date
        $effectiveFrom = $validated['effective_from'] ?? now()->toDateString();

        // Collision Check: Verify that this section and subject is not already assigned to another active teacher
        $existing = TeachingAssignment::where('school_year_id', $validated['school_year_id'])
            ->where('section_id', $validated['section_id'])
            ->where('subject_id', $validated['subject_id'])
            ->active()
            ->with('teacher')
            ->first();

        // If class is already taken, reject with HTTP 422 Unprocessable Entity
        if ($existing) {
            $teacherName = $existing->teacher?->name ?? 'another faculty member';

            return response()->json([
                'message' => "This class is already assigned to {$teacherName}. It cannot be reassigned while taken.",
            ], 422);
        }

        // Create and persist new teaching assignment
        $assignment = TeachingAssignment::create([
            'user_id' => $validated['user_id'],
            'school_year_id' => $validated['school_year_id'],
            'section_id' => $validated['section_id'],
            'subject_id' => $validated['subject_id'],
            'effective_from' => $effectiveFrom,
            // Track administrator who authorized this workload assignment
            'assigned_by' => $request->user()->id,
        ]);

        // Return 201 Created response containing the newly created teaching assignment resource
        return response()->json([
            'message' => 'Teaching assignment created successfully.',
            'data' => new TeachingAssignmentResource($assignment->load(['teacher', 'section.gradeLevel', 'subject', 'schoolYear'])),
        ], 201);
    }

    // Terminate an active teaching assignment by recording an effective end date
    public function destroy(TeachingAssignment $teaching_assignment): JsonResponse
    {
        // Record today as effective_until to soft-close workload without deleting historical record
        $teaching_assignment->update([
            'effective_until' => now()->toDateString(),
        ]);

        // Return confirmation that workload assignment was closed
        return response()->json([
            'message' => 'Teaching assignment ended successfully.',
        ]);
    }

    // Synchronize full teaching load matrix for a faculty member in an academic school year
    public function syncTeacher(SyncTeachingAssignmentRequest $request): JsonResponse
    {
        // Extract validated matrix payload from SyncTeachingAssignmentRequest
        $validated = $request->validated();

        $userId = $validated['user_id'];
        $schoolYearId = $validated['school_year_id'];
        $effectiveFrom = $validated['effective_from'] ?? now()->toDateString();
        $adminId = $request->user()->id;

        // Execute workload synchronization inside a database transaction
        DB::transaction(function () use ($userId, $schoolYearId, $validated, $effectiveFrom, $adminId): void {
            // Build lookup map of incoming submitted section-subject key pairs: "sectionId-subjectId"
            $submittedPairs = collect($validated['assignments'])
                ->mapWithKeys(fn ($item) => [$item['section_id'].'-'.$item['subject_id'] => true])
                ->all();

            // Fetch currently active assignments for this teacher in this school year
            $currentAssignments = TeachingAssignment::forTeacher($userId)
                ->forSchoolYear($schoolYearId)
                ->active()
                ->get();

            // Build lookup map of existing active assignments
            $existingPairKeys = $currentAssignments
                ->mapWithKeys(fn ($a) => [$a->section_id.'-'.$a->subject_id => true])
                ->all();

            // Identify assignments that were unselected/removed from the teacher's load matrix
            $toEnd = $currentAssignments->filter(
                fn ($a) => ! isset($submittedPairs[$a->section_id.'-'.$a->subject_id])
            );

            // Close removed assignments by updating effective_until to today
            if ($toEnd->isNotEmpty()) {
                TeachingAssignment::whereIn('id', $toEnd->pluck('id'))
                    ->update(['effective_until' => now()->toDateString()]);
            }

            // Identify newly selected assignments that need to be added
            $newPairs = collect($validated['assignments'])
                ->filter(fn ($item) => ! isset($existingPairKeys[$item['section_id'].'-'.$item['subject_id']]));

            // If no new loads need to be created, exit transaction early
            if ($newPairs->isEmpty()) {
                return;
            }

            // If any newly assigned class was previously held by another teacher, close their assignment
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

            // Prepare timestamps for bulk insert
            $now = now()->toDateTimeString();

            // Format array of insert records for newly added teaching loads
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

            // Perform batch insert of new teaching loads
            TeachingAssignment::insert($inserts);
        });

        // Return confirmation that teacher assignments matrix was synchronized
        return response()->json([
            'message' => 'Teaching assignments updated successfully.',
        ]);
    }
}
