<?php

use Illuminate\Support\Facades\Route;

// Health and status endpoint for pure API backend deployment
Route::get('/', function () {
    return response()->json([
        'name' => 'DNIHS Assessment System API', // API service identifier
        'status' => 'active', // Service health status
        'institution' => 'Dayap National Integrated High School', // Operating institution
        'endpoints' => [
            'health' => '/api/health', // API health check route
            'reference_data' => '/api/reference-data', // Academic reference data route
        ],
    ]);
});

// Fallback route returning JSON error for all unregistered web paths
Route::fallback(function () {
    return response()->json([
        'message' => 'Route not found. This service operates exclusively as a backend API.', // 404 notice
    ], 404);
});
