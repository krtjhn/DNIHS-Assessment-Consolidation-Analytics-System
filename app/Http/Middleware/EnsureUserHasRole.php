<?php

// Declare strict PHP syntax for role authorization middleware

namespace App\Http\Middleware;

// Import Closure class to pass request down the middleware execution pipeline
use Closure;
// Import incoming HTTP request contract
use Illuminate\Http\Request;
// Import Symfony HTTP response contract
use Symfony\Component\HttpFoundation\Response;

// EnsureUserHasRole intercepts incoming HTTP requests to enforce Role-Based Access Control (RBAC)
class EnsureUserHasRole
{
    // Handle incoming HTTP request and verify authenticated user possesses at least one authorized role
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Retrieve the currently authenticated user instance via Sanctum token
        $user = $request->user();

        // Reject immediately if no authenticated user session or token exists
        if (! $user) {
            // Return HTTP 401 Unauthorized response
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Initialize authorization flag tracking whether user matches any allowed role
        $hasAnyRole = false;

        // Iterate through all specified authorized role arguments passed to middleware
        foreach ($roles as $role) {
            // Split multiple roles separated by commas or pipe symbols (e.g., 'admin,teacher' or 'admin|teacher')
            $splitRoles = preg_split('/[,|]/', $role);

            // Check each parsed role slug
            foreach ($splitRoles as $r) {
                // Determine whether user possesses this specific role via User::hasRole()
                if ($user->hasRole(trim($r))) {
                    // Set authorization flag to true when match is found
                    $hasAnyRole = true;
                    // Break out of both outer and inner loops immediately on first valid role match
                    break 2;
                }
            }
        }

        // If the authenticated user does not possess any of the authorized roles
        if (! $hasAnyRole) {
            // Join authorized roles with human-readable 'or' conjunction for error diagnostics
            $roleList = implode(' or ', $roles);

            // Return HTTP 403 Forbidden response explaining role restriction
            return response()->json([
                'message' => "Access denied. Only {$roleList} accounts are authorized for this action.",
            ], 403);
        }

        // Allow authorized request to proceed to next middleware or target controller action
        return $next($request);
    }
}
