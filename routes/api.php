<?php

use App\Http\Controllers\Api\AcademicReferenceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SectionController;
use Illuminate\Support\Facades\Route;

// Health Check
Route::get('/health', fn () => response()->json(['message' => 'API is active and running.']));

// Public Authentication
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Academic Reference Data (Dropdowns)
    Route::get('/reference-data', [AcademicReferenceController::class, 'referenceData']);

    // Section CRUD: Viewable by authenticated staff
    Route::get('/sections',          [SectionController::class, 'index']);
    Route::get('/sections/{section}', [SectionController::class, 'show']);

    // Section CRUD: Write operations restricted to System Admin only!
    Route::middleware('role:system_admin')->group(function () {
        Route::post('/sections',          [SectionController::class, 'store']);
        Route::put('/sections/{section}', [SectionController::class, 'update']);
        Route::delete('/sections/{section}', [SectionController::class, 'destroy']);
    });
});