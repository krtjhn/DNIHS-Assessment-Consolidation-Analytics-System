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

// Teacher Controller managing faculty provisioning, registration approval workflow, and account deactivation
class TeacherController extends Controller
{
    // List faculty accounts, filter by active status, and calculate active teaching loads count
    public function index(Request $request): JsonResponse
    {
        // Check if the administrator requested to include inactive/pending faculty members
        $includeInactive = $request->boolean('include_inactive');

        // Query users with the teacher role
        $teachers = User::query()
            // Restrict query to users assigned the teacher role
            ->whereHas('roles', fn ($query) => $query->where('name', 'teacher'))
            // If include_inactive is false, filter only active and approved accounts
            ->when(! $includeInactive, fn ($query) => $query->where('is_active', true)->where('approval_status', 'approved'))
            // Eagerly compute the count of currently active teaching assignments per teacher
            ->withCount([
                'teachingAssignments as active_loads_count' => fn ($query) => $query->active(),
            ])
            // Sort faculty list alphabetically by name
            ->orderBy('name')
            // Select only necessary attributes for account management
            ->get(['id', 'name', 'email', 'is_active', 'approval_status', 'approved_at', 'created_at']);

        // Return faculty accounts list
        return response()->json([
            'data' => $teachers,
        ]);
    }

    // Directly provision a new faculty account with immediate approval and activation
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        // Extract validated teacher attributes from StoreTeacherRequest
        $validated = $request->validated();

        // Create faculty user account with pre-approved and active status
        $teacher = User::create([
            // Full name of faculty member
            'name' => $validated['name'],
            // Institutional email address
            'email' => $validated['email'],
            // Hash password securely using bcrypt
            'password' => Hash::make($validated['password']),
            // Set account to active immediately
            'is_active' => true,
            // Mark approval status as approved
            'approval_status' => 'approved',
            // Record current timestamp as approval date
            'approved_at' => now(),
        ]);

        // Find standard teacher role in database
        $teacherRole = Role::where('name', 'teacher')->first();
        if ($teacherRole) {
            // Assign teacher role in role_user pivot table
            $teacher->roles()->attach($teacherRole->id);
        }

        // Return 201 Created response containing newly provisioned teacher model
        return response()->json([
            'message' => 'Faculty member account provisioned successfully.',
            'data' => $teacher->load('roles'),
        ], 201);
    }

    // Approve a pending self-registered faculty account
    public function approve(User $teacher): JsonResponse
    {
        // Safeguard: Verify target user possesses the teacher role
        if (! $teacher->hasRole('teacher')) {
            return response()->json([
                'message' => 'Only teacher registrations can be approved.',
            ], 422);
        }

        // Update account to approved and active status with approval timestamp
        $teacher->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'is_active' => true,
        ]);

        // Return success response confirming account activation
        return response()->json([
            'message' => "Registration for {$teacher->name} has been approved and activated.",
            'data' => $teacher,
        ]);
    }

    // Reject a pending self-registration request
    public function reject(User $teacher): JsonResponse
    {
        // Safeguard: Ensure user is a teacher and cannot reject an administrator
        if (! $teacher->hasRole('teacher') || $teacher->hasRole('system_admin')) {
            return response()->json([
                'message' => 'Only teacher registrations can be rejected.',
            ], 422);
        }

        // Update account state to rejected and deactivated
        $teacher->update([
            'approval_status' => 'rejected',
            'is_active' => false,
        ]);

        // Return confirmation that the applicant was rejected
        return response()->json([
            'message' => "Registration for {$teacher->name} was rejected.",
            'data' => $teacher,
        ]);
    }

    // Reactivate a previously deactivated faculty account
    public function reactivate(User $teacher): JsonResponse
    {
        // Safeguard: Ensure only faculty accounts can be reactivated
        if (! $teacher->hasRole('teacher')) {
            return response()->json([
                'message' => 'Only teacher accounts can be reactivated.',
            ], 422);
        }

        // Restore active status and preserve or set approval timestamp
        $teacher->update([
            'is_active' => true,
            'approval_status' => 'approved',
            'approved_at' => $teacher->approved_at ?? now(),
        ]);

        // Return confirmation that account was successfully restored
        return response()->json([
            'message' => "Teacher account for {$teacher->name} was restored successfully.",
            'data' => $teacher,
        ]);
    }

    // Deactivate a faculty account while strictly preserving all historical student assessment records
    public function destroy(User $teacher): JsonResponse
    {
        // Safeguard: Prevent deleting system administrators or non-teacher accounts
        if (! $teacher->hasRole('teacher') || $teacher->hasRole('system_admin')) {
            return response()->json([
                'message' => 'Only teacher accounts without administrator access can be removed.',
            ], 422);
        }

        // Execute deactivation procedures within a database transaction
        DB::transaction(function () use ($teacher): void {
            // End all active teaching assignments by timestamping effective_until date
            TeachingAssignment::query()
                ->where('user_id', $teacher->id)
                ->active()
                ->update(['effective_until' => now()->toDateString()]);

            // Revoke all existing Sanctum API access tokens to terminate active sessions
            $teacher->tokens()->delete();

            // Mark user account as inactive
            $teacher->update(['is_active' => false]);
        });

        // Return confirmation explaining that historical assessment score records remain intact
        return response()->json([
            'message' => 'Teacher account removed. Historical assessment records were preserved.',
        ]);
    }
}
