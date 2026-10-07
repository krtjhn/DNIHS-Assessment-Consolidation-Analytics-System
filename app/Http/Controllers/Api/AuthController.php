<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * User Registration (Teacher or Admin).
     * POST /api/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // 1. Create the user
        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        // 2. Attach Role (defaults to 'teacher')
        $roleName = $validated['role'] ?? 'teacher';
        $role = Role::where('name', $roleName)->first();
        if ($role) {
            $user->roles()->attach($role->id);
        }

        // 3. Issue Sanctum token immediately
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Registration successful.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user->load('roles'),
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

        // Check if account is active
        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account is deactivated. Please contact the administrator.',
            ], 403);
        }

        // Issue Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Login successful.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user->load('roles'),
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