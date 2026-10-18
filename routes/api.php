<?php

// Import API controllers for route registration
use App\Http\Controllers\Api\AcademicReferenceController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SchoolYearController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\TeacherAssignmentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TermController;
// Import Laravel Route facade
use Illuminate\Support\Facades\Route;

// Public health check route to verify backend availability and API responsiveness
Route::get('/health', fn () => response()->json(['message' => 'API is active and running.']));

// Public authentication endpoint for self-registration of teacher accounts
Route::post('/auth/register', [AuthController::class, 'register']);
// Public authentication endpoint for logging in with credentials to obtain Sanctum bearer tokens
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated API routes requiring valid Laravel Sanctum bearer token
Route::middleware('auth:sanctum')->group(function () {

    // Revoke current user session and invalidate the active bearer token
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    // Fetch profile and roles of the currently authenticated user
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Retrieve master academic lookup data (grade levels, subjects, active school years, and terms)
    Route::get('/reference-data', [AcademicReferenceController::class, 'referenceData']);

    // Retrieve list of all school years with optional active filter
    Route::get('/school-years', [SchoolYearController::class, 'index']);
    // Retrieve details for a specific school year by ID
    Route::get('/school-years/{school_year}', [SchoolYearController::class, 'show']);
    // Retrieve academic terms with optional school year filter
    Route::get('/terms', [TermController::class, 'index']);
    // Retrieve details for a specific term by ID
    Route::get('/terms/{term}', [TermController::class, 'show']);

    // Retrieve classroom sections with optional grade level and school year filters
    Route::get('/sections', [SectionController::class, 'index']);
    // Retrieve details for a specific classroom section by ID
    Route::get('/sections/{section}', [SectionController::class, 'show']);

    // Retrieve classroom sections and subjects assigned to the logged-in teacher for active school year
    Route::get('/my-classes', [AssessmentController::class, 'myClasses']);
    // Retrieve full teaching assignment records for the authenticated teacher
    Route::get('/my-assignments', [TeacherAssignmentController::class, 'myAssignments']);

    // Query and filter individual assessment records with statistical metrics
    Route::get('/assessments', [AssessmentController::class, 'index']);
    // Aggregate assessment metrics across sections, grade levels, or school-wide using pooled variance
    Route::get('/assessments/consolidation', [AssessmentController::class, 'consolidation']);
    // View detailed metrics and raw scores for a single assessment record by ID
    Route::get('/assessments/{assessment}', [AssessmentController::class, 'show']);

    // Assessment modification routes restricted to authorized teachers and system administrators
    Route::middleware('role:teacher,system_admin')->group(function () {
        // Record and calculate statistics for a new assessment score sheet
        Route::post('/assessments', [AssessmentController::class, 'store']);
        // Update raw scores and recalculate statistical metrics for an existing assessment
        Route::put('/assessments/{assessment}', [AssessmentController::class, 'update']);
        // Remove an assessment record from the database
        Route::delete('/assessments/{assessment}', [AssessmentController::class, 'destroy']);
    });

    // Administrative configuration routes strictly restricted to system administrators
    Route::middleware('role:system_admin')->group(function () {
        // Create a new academic school year and automatically generate its 3 terms
        Route::post('/school-years', [SchoolYearController::class, 'store']);
        // Update school year details or activate/deactivate an academic year
        Route::put('/school-years/{school_year}', [SchoolYearController::class, 'update']);
        // Delete an inactive school year that has no associated assessment history
        Route::delete('/school-years/{school_year}', [SchoolYearController::class, 'destroy']);
        // Lock or unlock an academic term to control teacher score entry permissions
        Route::patch('/terms/{term}/status', [TermController::class, 'updateStatus']);

        // Create a new classroom section within a grade level and school year
        Route::post('/sections', [SectionController::class, 'store']);
        // Update section name or active status
        Route::put('/sections/{section}', [SectionController::class, 'update']);
        // Soft delete an active section while preserving historical assessment data
        Route::delete('/sections/{section}', [SectionController::class, 'destroy']);

        // List faculty accounts with pending approval, active, or deactivated filter states
        Route::get('/teachers', [TeacherController::class, 'index']);
        // Manually create and activate a new teacher account
        Route::post('/teachers', [TeacherController::class, 'store']);
        // Approve a pending self-registered teacher account
        Route::patch('/teachers/{teacher}/approve', [TeacherController::class, 'approve']);
        // Reject and delete an invalid self-registration submission
        Route::patch('/teachers/{teacher}/reject', [TeacherController::class, 'reject']);
        // Reactivate a previously deactivated teacher account
        Route::patch('/teachers/{teacher}/reactivate', [TeacherController::class, 'reactivate']);
        // Deactivate an active faculty account
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']);

        // List all teaching assignment records across the school
        Route::get('/teaching-assignments', [TeacherAssignmentController::class, 'index']);
        // Create an individual teaching assignment linking teacher, section, and subject
        Route::post('/teaching-assignments', [TeacherAssignmentController::class, 'store']);
        // Batch synchronize and replace all teaching assignments for a specific teacher
        Route::post('/teaching-assignments/sync', [TeacherAssignmentController::class, 'syncTeacher']);
        // Remove a teaching assignment record
        Route::delete('/teaching-assignments/{teaching_assignment}', [TeacherAssignmentController::class, 'destroy']);
    });
});
