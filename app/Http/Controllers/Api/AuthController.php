<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// Authentication Controller managing user self-registration, Sanctum token issuance, and account lifecycle states
class AuthController extends Controller
{
    // Register a new faculty account with pending administrator approval status
    public function register(RegisterRequest $request): JsonResponse
    {
        // Extract validated registration attributes (name, institutional email, confirmed password)
        $validated = $request->validated();

        // Create the user account with inactive status and pending approval flag
        $user = User::create([
            // Full name of faculty member
            'name' => $validated['name'],
            // Official DepEd institutional email address
            'email' => $validated['email'],
            // Securely hash password using bcrypt before saving
            'password' => Hash::make($validated['password']),
            // Inactive by default until approved by school administrator
            'is_active' => false,
            // Explicit pending approval lifecycle state
            'approval_status' => 'pending',
        ]);

        // Query the standard teacher role from the database
        $role = Role::where('name', 'teacher')->first();
        if ($role) {
            // Attach teacher role to user in role_user pivot table
            $user->roles()->attach($role->id);
        }

        // Return 201 Created response notifying applicant of pending administrative review
        return response()->json([
            // Success confirmation message
            'message' => 'Registration submitted successfully. Your account is pending administrator approval before you can sign in.',
            // Client flag indicating login requires administrator clearance
            'requires_approval' => true,
            // Basic applicant profile summary
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'approval_status' => 'pending',
            ],
        ], 201);
    }

    // Authenticate user credentials and issue Laravel Sanctum Bearer token
    public function login(LoginRequest $request): JsonResponse
    {
        // Extract validated credentials from LoginRequest
        $validated = $request->validated();

        // Find user by institutional email address
        $user = User::where('email', $validated['email'])->first();

        // Verify that the user exists and the provided plaintext password matches the stored bcrypt hash
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            // Throw standard validation exception resulting in HTTP 422 Unprocessable Entity
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Safeguard: Check if account registration is still awaiting administrator approval
        if ($user->approval_status === 'pending') {
            return response()->json([
                'message' => 'Your account registration is currently pending administrator approval. Please wait for an administrator to activate your account.',
            ], 403);
        }

        // Safeguard: Check if account registration was explicitly rejected by the administrator
        if ($user->approval_status === 'rejected') {
            return response()->json([
                'message' => 'Your account registration was not approved. Please contact the school administrator.',
            ], 403);
        }

        // Safeguard: Check if account has been suspended or deactivated
        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact the administrator.',
            ], 403);
        }

        // Generate personal access token using Laravel Sanctum for API authorization
        $token = $user->createToken('auth_token')->plainTextToken;

        // Return HTTP 200 response with Bearer token and user profile including assigned roles
        return response()->json([
            // Login confirmation message
            'message' => 'Login successful.',
            // Sanctum plaintext bearer token
            'access_token' => $token,
            // Standard OAuth token type
            'token_type' => 'Bearer',
            // Authenticated user model with loaded roles
            'user' => $user->load('roles'),
        ]);
    }

    // Revoke the user's current personal access token upon logout
    public function logout(Request $request): JsonResponse
    {
        // Delete current active access token from personal_access_tokens table
        $request->user()->currentAccessToken()->delete();

        // Return confirmation of successful session termination
        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    // Return the profile and role details of the currently authenticated user
    public function me(Request $request): JsonResponse
    {
        // Return authenticated user model with eager-loaded role permissions
        return response()->json([
            'user' => $request->user()->load('roles'),
        ]);
    }
}
