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

// Handles user registration, login, logout, and profile checks
class AuthController extends Controller
{
    // Register a new teacher account awaiting administrator approval
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated(); // Get validated registration data

        // Create the teacher account with pending status
        $user = User::create([
            'name' => $validated['name'], // Teacher full name
            'email' => $validated['email'], // Teacher email address
            'password' => Hash::make($validated['password']), // Securely hash password
            'is_active' => false, // Inactive until admin approves
            'approval_status' => 'pending', // Pending approval status
        ]);

        // Assign the teacher role
        $role = Role::where('name', 'teacher')->first(); // Fetch teacher role model
        if ($role) {
            $user->roles()->attach($role->id); // Attach teacher role in pivot table
        }

        return response()->json([
            'message' => 'Registration submitted successfully. Your account is pending administrator approval before you can sign in.', // Success message
            'requires_approval' => true, // Flag indicating approval is required
            'user' => [
                'id' => $user->id, // User id
                'name' => $user->name, // Full name
                'email' => $user->email, // Email address
                'approval_status' => 'pending', // Pending status
            ],
        ], 201);
    }

    // Authenticate user credentials and return an API token
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated(); // Retrieve validated login credentials

        $user = User::where('email', $validated['email'])->first(); // Find user by email

        // Check if user exists and password is correct
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'], // Authentication failure
            ]);
        }

        // Check if registration is still pending approval
        if ($user->approval_status === 'pending') {
            return response()->json([
                'message' => 'Your account registration is currently pending administrator approval. Please wait for an administrator to activate your account.', // Pending message
            ], 403);
        }

        // Check if registration was rejected
        if ($user->approval_status === 'rejected') {
            return response()->json([
                'message' => 'Your account registration was not approved. Please contact the school administrator.', // Rejected message
            ], 403);
        }

        // Check if account has been deactivated
        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact the administrator.', // Deactivated message
            ], 403);
        }

        // Create access token
        $token = $user->createToken('auth_token')->plainTextToken; // Issue Sanctum bearer token

        return response()->json([
            'message' => 'Login successful.', // Success confirmation
            'access_token' => $token, // Sanctum bearer token string
            'token_type' => 'Bearer', // Bearer authorization scheme
            'user' => $user->load('roles'), // Return user profile with roles loaded
        ]);
    }

    // Revoke the user token on logout
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete(); // Invalidate active Sanctum token

        return response()->json([
            'message' => 'Logged out successfully.', // Logout confirmation
        ]);
    }

    // Return the profile of the logged-in user
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('roles'), // Return current user with roles
        ]);
    }
}
