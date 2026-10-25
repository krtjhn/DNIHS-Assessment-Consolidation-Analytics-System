<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeachingAssignments\StoreTeachingAssignmentRequest;
use App\Http\Requests\TeachingAssignments\SyncTeachingAssignmentRequest;
use App\Http\Resources\TeachingAssignmentResource;
use App\Models\TeachingAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// Manages teacher class assignments and bulk assignment sync
class TeacherAssignmentController extends Controller
{
    // List all active teaching assignments with optional filters
    public function index(Request $request): JsonResponse
    {
        $query = TeachingAssignment::with(['teacher', 'section.gradeLevel', 'subject', 'schoolYear']) // Eager load relations
            ->active(); // Scope to active assignments

        if ($request->filled('school_year_id')) {
            $query->forSchoolYear((int) $request->school_year_id); // Filter by target school year
        }

        if ($request->filled('user_id')) {
            $query->forTeacher((int) $request->user_id); // Filter by teacher user ID
        }

        return response()->json([
            'data' => TeachingAssignmentResource::collection($query->get()), // Return formatted collection
        ]);
    }

    // Assign a teacher to a specific section and subject
    public function store(StoreTeachingAssignmentRequest $request): JsonResponse
    {
        $validated = $request->validated(); // Retrieve validated inputs
        $effectiveFrom = $validated['effective_from'] ?? now()->toDateString(); // Default to today's date

        // Check if another teacher is already assigned to this section and subject
        $existing = TeachingAssignment::where('school_year_id', $validated['school_year_id'])
            ->where('section_id', $validated['section_id'])
            ->where('subject_id', $validated['subject_id'])
            ->active()
            ->with('teacher')
            ->first(); // Search for active assignment

        // Stop assignment if the class is already taken
        if ($existing) {
            $teacherName = $existing->teacher?->name ?? 'another faculty member'; // Resolve occupying teacher name

            return response()->json([
                'message' => "This class is already assigned to {$teacherName}. It cannot be reassigned while taken.", // Conflict response
            ], 422);
        }

        $assignment = TeachingAssignment::create([
            'user_id' => $validated['user_id'], // Teacher user id
            'school_year_id' => $validated['school_year_id'], // School year id
            'section_id' => $validated['section_id'], // Section id
            'subject_id' => $validated['subject_id'], // Subject id
            'effective_from' => $effectiveFrom, // Effective start date
            'assigned_by' => $request->user()->id, // Admin creator id
        ]);

        Cache::store('file')->forget("teacher_classes_{$assignment->user_id}_{$assignment->school_year_id}"); // Bust cache

        return response()->json([
            'message' => 'Teaching assignment created successfully.', // Creation confirmation
            'data' => new TeachingAssignmentResource($assignment->load(['teacher', 'section.gradeLevel', 'subject', 'schoolYear'])), // Formatted resource
        ], 201);
    }

    // End an active teaching assignment
    public function destroy(TeachingAssignment $teaching_assignment): JsonResponse
    {
        // Set the end date to today to close the assignment
        $teaching_assignment->update([
            'effective_until' => now()->toDateString(), // Mark assignment concluded today
        ]);

        Cache::store('file')->forget("teacher_classes_{$teaching_assignment->user_id}_{$teaching_assignment->school_year_id}"); // Bust cache

        return response()->json([
            'message' => 'Teaching assignment ended successfully.', // Deactivation confirmation
        ]);
    }

    // Sync all assigned classes for a teacher in a school year at once
    public function syncTeacher(SyncTeachingAssignmentRequest $request): JsonResponse
    {
        $validated = $request->validated(); // Retrieve validated payload

        $userId = $validated['user_id']; // Target teacher user ID
        $schoolYearId = $validated['school_year_id']; // Target academic year ID
        $effectiveFrom = $validated['effective_from'] ?? now()->toDateString(); // Start date
        $adminId = $request->user()->id; // Authorizing administrator ID

        DB::transaction(function () use ($userId, $schoolYearId, $validated, $effectiveFrom, $adminId): void {
            // Map of new submitted section-subject pairs
            $submittedPairs = collect($validated['assignments'])
                ->mapWithKeys(fn ($item) => [$item['section_id'].'-'.$item['subject_id'] => true])
                ->all(); // Keyed lookup map

            $currentAssignments = TeachingAssignment::forTeacher($userId)
                ->forSchoolYear($schoolYearId)
                ->active()
                ->get(); // Current active assignments

            $existingPairKeys = $currentAssignments
                ->mapWithKeys(fn ($a) => [$a->section_id.'-'.$a->subject_id => true])
                ->all(); // Existing lookup map

            // Find assignments that were removed and close them
            $toEnd = $currentAssignments->filter(
                fn ($a) => ! isset($submittedPairs[$a->section_id.'-'.$a->subject_id])
            ); // Filter out unselected classes

            if ($toEnd->isNotEmpty()) {
                TeachingAssignment::whereIn('id', $toEnd->pluck('id'))
                    ->update(['effective_until' => now()->toDateString()]); // Close dropped assignments
            }

            // Find newly selected assignments
            $newPairs = collect($validated['assignments'])
                ->filter(fn ($item) => ! isset($existingPairKeys[$item['section_id'].'-'.$item['subject_id']])); // Extract new classes

            if ($newPairs->isEmpty()) {
                return; // Nothing new to insert
            }

            // Close any previous teacher assignment for the newly assigned classes
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
                ->update(['effective_until' => now()->toDateString()]); // Unassign previous teachers

            $now = now()->toDateTimeString(); // Timestamp string

            $inserts = $newPairs->map(fn ($item) => [
                'user_id' => $userId, // Teacher ID
                'school_year_id' => $schoolYearId, // School year ID
                'section_id' => $item['section_id'], // Section ID
                'subject_id' => $item['subject_id'], // Subject ID
                'effective_from' => $effectiveFrom, // Start date
                'assigned_by' => $adminId, // Admin ID
                'created_at' => $now, // Created at
                'updated_at' => $now, // Updated at
            ])->values()->all(); // Format batch records

            TeachingAssignment::insert($inserts); // Bulk insert new assignments
        });

        Cache::store('file')->forget("teacher_classes_{$userId}_{$schoolYearId}"); // Bust cache

        return response()->json([
            'message' => 'Teaching assignments updated successfully.', // Sync confirmation
        ]);
    }
}
