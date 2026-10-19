<?php

use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// Configure the base Laravel application instance
return Application::configure(basePath: dirname(__DIR__))
    // Register application routes
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Register middleware and aliases
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies for load balancers and hosting environments like Render or Fly.io
        $middleware->trustProxies(at: '*');
        // Register role-based access control middleware alias
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    // Configure exception handling
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
