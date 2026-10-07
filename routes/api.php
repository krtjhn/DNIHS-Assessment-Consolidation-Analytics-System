<?php

use App\Http\Controllers\Api\AcademicReferenceController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SchoolYearController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\TeacherAssignmentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TermController;
use Illuminate\Support\Facades\Route;

// Health Check
Route::get('/health', fn () => response()->json(['message' => 'API is active and running.']));

// Authentication (Public)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth Session
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Academic Reference Data (Dropdowns)
    Route::get('/reference-data', [AcademicReferenceController::class, 'referenceData']);

    // School Calendar & Terms
    Route::get('/school-years', [SchoolYearController::class, 'index']);
    Route::get('/school-years/{school_year}', [SchoolYearController::class, 'show']);
    Route::get('/terms', [TermController::class, 'index']);
    Route::get('/terms/{term}', [TermController::class, 'show']);

    // Section Management
    Route::get('/sections', [SectionController::class, 'index']);
    Route::get('/sections/{section}', [SectionController::class, 'show']);

    // Teacher Assigned Loads
    Route::get('/my-classes', [AssessmentController::class, 'myClasses']);
    Route::get('/my-assignments', [TeacherAssignmentController::class, 'myAssignments']);

    // Assessments & Reports
    Route::get('/assessments', [AssessmentController::class, 'index']);
    Route::get('/assessments/consolidation', [AssessmentController::class, 'consolidation']);
    Route::get('/assessments/{assessment}', [AssessmentController::class, 'show']);

    // Teacher Only - Score Recording
    Route::middleware('role:teacher')->group(function () {
        Route::post('/assessments', [AssessmentController::class, 'store']);
        Route::put('/assessments/{assessment}', [AssessmentController::class, 'update']);
        Route::delete('/assessments/{assessment}', [AssessmentController::class, 'destroy']);
    });

    // Admin Only - School Management
    Route::middleware('role:system_admin')->group(function () {
        // School Calendar Management
        Route::post('/school-years', [SchoolYearController::class, 'store']);
        Route::put('/school-years/{school_year}', [SchoolYearController::class, 'update']);
        Route::delete('/school-years/{school_year}', [SchoolYearController::class, 'destroy']);
        Route::patch('/terms/{term}/status', [TermController::class, 'updateStatus']);

        // Section CRUD
        Route::post('/sections', [SectionController::class, 'store']);
        Route::put('/sections/{section}', [SectionController::class, 'update']);
        Route::delete('/sections/{section}', [SectionController::class, 'destroy']);

        // Faculty Accounts Management
        Route::get('/teachers', [TeacherController::class, 'index']);
        Route::post('/teachers', [TeacherController::class, 'store']);
        Route::patch('/teachers/{teacher}/approve', [TeacherController::class, 'approve']);
        Route::patch('/teachers/{teacher}/reject', [TeacherController::class, 'reject']);
        Route::patch('/teachers/{teacher}/reactivate', [TeacherController::class, 'reactivate']);
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']);

        // Teaching Assignments Matrix
        Route::get('/teaching-assignments', [TeacherAssignmentController::class, 'index']);
        Route::post('/teaching-assignments', [TeacherAssignmentController::class, 'store']);
        Route::post('/teaching-assignments/sync', [TeacherAssignmentController::class, 'syncTeacher']);
        Route::delete('/teaching-assignments/{teaching_assignment}', [TeacherAssignmentController::class, 'destroy']);
    });
});
