<?php

return [

    // Paths that should have CORS headers applied
    'paths' => ['api/*', 'sanctum/csrf-cookie'], // Apply CORS to all API routes

    // HTTP methods permitted
    'allowed_methods' => ['*'], // Allow all HTTP request methods

    // Allowed origins (support custom domain, local development)
    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL'), // Custom frontend domain from env
        'http://localhost:5173', // Vite local development server
        'http://localhost:3000', // Alternative local dev port
        'http://127.0.0.1:8000', // Local Laravel server
    ])),

    // Regex patterns for dynamic Vercel preview and production deployment URLs
    'allowed_origins_patterns' => [
        '#^https://.*\.vercel\.app$#', // Allow all Vercel deployment domains
    ],

    // HTTP headers permitted
    'allowed_headers' => ['*'], // Allow all headers (Authorization, Content-Type, etc.)

    // Headers exposed to browser JS
    'exposed_headers' => [], // No custom exposed headers

    // Cache preflight OPTIONS response for 24 hours to reduce latency
    'max_age' => 86400, // Preflight max age in seconds

    // Allow credentials with cross-origin requests
    'supports_credentials' => true, // Allow cookies and Bearer tokens

];
