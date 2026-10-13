<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request and check if user has any of the required roles.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $hasAnyRole = false;
        foreach ($roles as $role) {
            $splitRoles = preg_split('/[,|]/', $role);
            foreach ($splitRoles as $r) {
                if ($user->hasRole(trim($r))) {
                    $hasAnyRole = true;
                    break 2;
                }
            }
        }

        if (! $hasAnyRole) {
            $roleList = implode(' or ', $roles);

            return response()->json([
                'message' => "Access denied. Only {$roleList} accounts are authorized for this action.",
            ], 403);
        }

        return $next($request);
    }
}
