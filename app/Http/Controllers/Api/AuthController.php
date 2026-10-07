<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
// + Auth Requests mula sa subfolder
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * User Registration (Public portal - Faculty).
     * POST /api/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // 1. Create the user with pending approval
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => false,
            'approval_status' => 'pending',
        ]);

        // 2. Attach Teacher Role
        $role = Role::where('name', 'teacher')->first();
        if ($role) {
            $user->roles()->attach($role->id);
        }

        return response()->json([
            'message' => 'Registration submitted successfully. Your account is pending administrator approval before you can sign in.',
            'requires_approval' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'approval_status' => 'pending',
            ],
        ], 201);
    }

    /**
     * User Login.
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();

        // Check credentials
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Check approval status
        if ($user->approval_status === 'pending') {
            return response()->json([
                'message' => 'Your account registration is currently pending administrator approval. Please wait for an administrator to activate your account.',
            ], 403);
        }

        if ($user->approval_status === 'rejected') {
            return response()->json([
                'message' => 'Your account registration was not approved. Please contact the school administrator.',
            ], 403);
        }

        // Check if account is active
        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact the administrator.',
            ], 403);
        }

        // Issue Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('roles'),
        ]);
    }

    /**
     * User Logout.
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get Authenticated User Details.
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('roles'),
        ]);
    }
}
