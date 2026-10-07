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

class TeacherController extends Controller
{
    /**
     * List teacher accounts for administrator workflows.
     * GET /api/teachers
     */
    public function index(Request $request): JsonResponse
    {
        $includeInactive = $request->boolean('include_inactive');

        $teachers = User::query()
            ->whereHas('roles', fn ($query) => $query->where('name', 'teacher'))
            ->when(! $includeInactive, fn ($query) => $query->where('is_active', true)->where('approval_status', 'approved'))
            ->withCount([
                'teachingAssignments as active_loads_count' => fn ($query) => $query->active(),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'is_active', 'approval_status', 'approved_at', 'created_at']);

        return response()->json([
            'data' => $teachers,
        ]);
    }

    /**
     * Admin direct provisioning of faculty accounts.
     * POST /api/teachers
     */
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $teacher = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
            'approval_status' => 'approved',
            'approved_at' => now(),
        ]);

        $teacherRole = Role::where('name', 'teacher')->first();
        if ($teacherRole) {
            $teacher->roles()->attach($teacherRole->id);
        }

        return response()->json([
            'message' => 'Faculty member account provisioned successfully.',
            'data' => $teacher->load('roles'),
        ], 201);
    }

    /**
     * Approve a pending teacher registration.
     * PATCH /api/teachers/{teacher}/approve
     */
    public function approve(User $teacher): JsonResponse
    {
        if (! $teacher->hasRole('teacher')) {
            return response()->json([
                'message' => 'Only teacher registrations can be approved.',
            ], 422);
        }

        $teacher->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'is_active' => true,
        ]);

        return response()->json([
            'message' => "Registration for {$teacher->name} has been approved and activated.",
            'data' => $teacher,
        ]);
    }

    /**
     * Reject a pending teacher registration.
     * PATCH /api/teachers/{teacher}/reject
     */
    public function reject(User $teacher): JsonResponse
    {
        if (! $teacher->hasRole('teacher') || $teacher->hasRole('system_admin')) {
            return response()->json([
                'message' => 'Only teacher registrations can be rejected.',
            ], 422);
        }

        $teacher->update([
            'approval_status' => 'rejected',
            'is_active' => false,
        ]);

        return response()->json([
            'message' => "Registration for {$teacher->name} was rejected.",
            'data' => $teacher,
        ]);
    }

    /**
     * Reactivate a removed teacher account.
     * PATCH /api/teachers/{teacher}/reactivate
     */
    public function reactivate(User $teacher): JsonResponse
    {
        if (! $teacher->hasRole('teacher')) {
            return response()->json([
                'message' => 'Only teacher accounts can be reactivated.',
            ], 422);
        }

        $teacher->update([
            'is_active' => true,
            'approval_status' => 'approved',
            'approved_at' => $teacher->approved_at ?? now(),
        ]);

        return response()->json([
            'message' => "Teacher account for {$teacher->name} was restored successfully.",
            'data' => $teacher,
        ]);
    }

    /**
     * Remove a teacher's system access while retaining academic history.
     * DELETE /api/teachers/{teacher}
     */
    public function destroy(User $teacher): JsonResponse
    {
        if (! $teacher->hasRole('teacher') || $teacher->hasRole('system_admin')) {
            return response()->json([
                'message' => 'Only teacher accounts without administrator access can be removed.',
            ], 422);
        }

        DB::transaction(function () use ($teacher): void {
            TeachingAssignment::query()
                ->where('user_id', $teacher->id)
                ->active()
                ->update(['effective_until' => now()->toDateString()]);

            $teacher->tokens()->delete();
            $teacher->update(['is_active' => false]);
        });

        return response()->json([
            'message' => 'Teacher account removed. Historical assessment records were preserved.',
        ]);
    }
}
