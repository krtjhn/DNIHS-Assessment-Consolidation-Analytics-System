<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teachers\StoreTeacherRequest;
use App\Models\Role;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Manages teacher accounts, approvals, rejections, and deactivations
class TeacherController extends Controller
{
    // List teacher accounts with optional inactive filter and active load count
    public function index(Request $request): JsonResponse
    {
        $includeInactive = $request->boolean('include_inactive'); // Parse include_inactive boolean query param

        $teachers = User::query()
            ->whereHas('roles', fn ($query) => $query->where('name', 'teacher')) // Filter users with teacher role
            ->when(! $includeInactive, fn ($query) => $query->where('is_active', true)->where('approval_status', 'approved')) // Default active and approved
            ->withCount([
                'teachingAssignments as active_loads_count' => fn ($query) => $query->active(), // Count active class assignments
            ])
            ->orderBy('name') // Sort alphabetically by teacher name
            ->get(['id', 'name', 'email', 'email_verified_at', 'is_active', 'approval_status', 'approved_at', 'created_at']); // Specific columns

        return response()->json([
            'data' => $teachers, // Return teacher list
        ]);
    }

    // Directly create an active teacher account as administrator
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        $validated = $request->validated(); // Get validated payload

        $teacher = User::create([
            'name' => $validated['name'], // Teacher full name
            'email' => $validated['email'], // Teacher email
            'password' => Hash::make($validated['password']), // Securely hash password
            'is_active' => true, // Directly activate account
            'approval_status' => 'approved', // Pre-approve account
            'approved_at' => now(), // Approval timestamp
            'email_verified_at' => now(), // Verification timestamp
        ]);

        $teacherRole = Role::where('name', 'teacher')->first(); // Fetch teacher role model
        if ($teacherRole) {
            $teacher->roles()->attach($teacherRole->id); // Attach role in pivot table
        }

        return response()->json([
            'message' => 'Faculty member account provisioned successfully.', // Success message
            'data' => $teacher->load('roles'), // Return user with roles
        ], 201);
    }

    // Approve a pending self-registered teacher
    public function approve(User $teacher): JsonResponse
    {
        if (! $teacher->hasRole('teacher')) {
            return response()->json([
                'message' => 'Only teacher registrations can be approved.', // Validation error
            ], 422);
        }

        $teacher->update([
            'approval_status' => 'approved', // Mark approved
            'approved_at' => now(), // Record approval timestamp
            'is_active' => true, // Enable login access
            'email_verified_at' => $teacher->email_verified_at ?? now(), // Verify email
        ]);

        return response()->json([
            'message' => "Registration for {$teacher->name} has been approved and activated.", // Approval confirmation
            'data' => $teacher, // Return updated model
        ]);
    }

    // Reject a pending self-registered teacher
    public function reject(User $teacher): JsonResponse
    {
        // Do not allow rejecting an administrator
        if (! $teacher->hasRole('teacher') || $teacher->hasRole('system_admin')) {
            return response()->json([
                'message' => 'Only teacher registrations can be rejected.', // Guard against admin rejection
            ], 422);
        }

        $teacher->update([
            'approval_status' => 'rejected', // Mark rejected
            'is_active' => false, // Ensure account cannot log in
        ]);

        return response()->json([
            'message' => "Registration for {$teacher->name} was rejected.", // Rejection confirmation
            'data' => $teacher, // Return updated model
        ]);
    }

    // Reactivate a deactivated teacher account
    public function reactivate(User $teacher): JsonResponse
    {
        if (! $teacher->hasRole('teacher')) {
            return response()->json([
                'message' => 'Only teacher accounts can be reactivated.', // Guard check
            ], 422);
        }

        $teacher->update([
            'is_active' => true, // Restore active status
            'approval_status' => 'approved', // Ensure approved status
            'approved_at' => $teacher->approved_at ?? now(), // Preserve or set approval date
            'email_verified_at' => $teacher->email_verified_at ?? now(), // Preserve or set email verification
        ]);

        return response()->json([
            'message' => "Teacher account for {$teacher->name} was restored successfully.", // Restoration confirmation
            'data' => $teacher, // Return updated model
        ]);
    }

    // Deactivate a teacher account while preserving their past score sheets
    public function destroy(User $teacher): JsonResponse
    {
        // Do not allow deactivating an administrator
        if (! $teacher->hasRole('teacher') || $teacher->hasRole('system_admin')) {
            return response()->json([
                'message' => 'Only teacher accounts without administrator access can be removed.', // Guard check
            ], 422);
        }

        DB::transaction(function () use ($teacher): void {
            // End all active teaching assignments
            TeachingAssignment::query()
                ->where('user_id', $teacher->id)
                ->active()
                ->update(['effective_until' => now()->toDateString()]); // Close assignments

            // Log out the user by deleting all active tokens
            $teacher->tokens()->delete(); // Revoke Sanctum tokens

            // Mark account as inactive
            $teacher->update(['is_active' => false]); // Disable account login
        });

        return response()->json([
            'message' => 'Teacher account removed. Historical assessment records were preserved.', // Confirmation
        ]);
    }
}
