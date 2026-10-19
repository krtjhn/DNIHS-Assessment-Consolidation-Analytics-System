<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Check if the logged-in user has at least one of the required roles
class EnsureUserHasRole
{
    // Handle the incoming request and check user roles
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user(); // Get currently authenticated user instance

        // Deny access if the user is not logged in
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401); // 401 Unauthorized response
        }

        $hasAnyRole = false; // Initialize role match flag

        // Check each role passed to the middleware (supports commas or pipes like 'teacher,system_admin')
        foreach ($roles as $role) {
            $splitRoles = preg_split('/[,|]/', $role); // Split by comma or pipe

            foreach ($splitRoles as $r) {
                if ($user->hasRole(trim($r))) {
                    $hasAnyRole = true; // Match found
                    break 2; // Exit both loops immediately
                }
            }
        }

        // Return a 403 error if the user does not have any allowed role
        if (! $hasAnyRole) {
            $flattenedRoles = []; // Collect individual role names for error message
            foreach ($roles as $role) {
                foreach (preg_split('/[,|]/', $role) as $r) {
                    $trimmed = trim($r); // Trim whitespace
                    if ($trimmed !== '') {
                        $flattenedRoles[] = $trimmed; // Add non-empty role name
                    }
                }
            }
            $roleList = implode(' or ', array_unique($flattenedRoles)); // Format readable role list

            return response()->json([
                'message' => "Access denied. Only {$roleList} accounts are authorized for this action.", // 403 Forbidden message
            ], 403);
        }

        return $next($request); // Allow request to proceed to the controller
    }
}
