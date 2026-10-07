<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request and check user role.
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole($role)) {
            return response()->json([
                'message' => "Access denied. Only {$role} accounts are authorized for this action.",
            ], 403);
        }

        return $next($request);
    }
}
