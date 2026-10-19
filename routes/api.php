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

// Public health check route to verify backend is working
Route::get('/health', fn () => response()->json(['message' => 'API is active and running.'])); // Health check endpoint

// Public routes for teacher registration and login
Route::post('/auth/register', [AuthController::class, 'register']); // Self-register a new teacher account with pending status
Route::post('/auth/login', [AuthController::class, 'login']); // Log in user with email and password to receive API token

// Protected routes requiring authentication with Sanctum
Route::middleware('auth:sanctum')->group(function () {

    // Current user logout and profile
    Route::post('/auth/logout', [AuthController::class, 'logout']); // Log out user and delete current Sanctum token
    Route::get('/auth/me', [AuthController::class, 'me']); // Return currently logged in user profile and roles

    // Academic reference data
    Route::get('/reference-data', [AcademicReferenceController::class, 'referenceData']); // Get grade levels, subjects, active year, and terms

    // School years and terms
    Route::get('/school-years', [SchoolYearController::class, 'index']); // Get list of all school years with their terms
    Route::get('/terms', [TermController::class, 'index']); // Get all terms
    Route::get('/terms/{term}', [TermController::class, 'show']); // Get single term by id

    // Classroom sections list
    Route::get('/sections', [SectionController::class, 'index']); // Get active sections filtered by grade level or year

    // Classes assigned to the logged-in teacher
    Route::get('/my-classes', [AssessmentController::class, 'myClasses']); // Get classes assigned to current teacher

    // Assessment records list and detail
    Route::get('/assessments', [AssessmentController::class, 'index']); // Get assessments (teachers see own, admins see all)
    Route::get('/assessments/{assessment}', [AssessmentController::class, 'show'])->whereNumber('assessment'); // Get single assessment with statistics

    // Routes for teachers and admins to create, update, or delete assessments
    Route::middleware('role:teacher,system_admin')->group(function () {
        Route::post('/assessments', [AssessmentController::class, 'store']); // Save raw scores and calculate DepEd statistics
        Route::put('/assessments/{assessment}', [AssessmentController::class, 'update']); // Update scores and recalculate statistics
        Route::delete('/assessments/{assessment}', [AssessmentController::class, 'destroy']); // Delete an assessment record
    });

    // Admin only routes
    Route::middleware('role:system_admin')->group(function () {
        // Consolidated statistical reports for assessments
        Route::get('/assessments/consolidation', [AssessmentController::class, 'consolidation']); // Get consolidated report for sections, grades, or school

        // School years management
        Route::post('/school-years', [SchoolYearController::class, 'store']); // Create new school year and auto-generate 3 terms
        Route::put('/school-years/{school_year}', [SchoolYearController::class, 'update']); // Update school year details or active status
        Route::delete('/school-years/{school_year}', [SchoolYearController::class, 'destroy']); // Delete inactive school year if no assessments exist

        // Update term status
        Route::patch('/terms/{term}/status', [TermController::class, 'updateStatus']); // Change term status to pending, active, or completed

        // Sections management
        Route::post('/sections', [SectionController::class, 'store']); // Create a new section under a grade level and school year
        Route::put('/sections/{section}', [SectionController::class, 'update']); // Update section name or active status
        Route::delete('/sections/{section}', [SectionController::class, 'destroy']); // Soft delete section if no assessments exist

        // Teacher accounts management
        Route::get('/teachers', [TeacherController::class, 'index']); // List teachers with optional status filter
        Route::post('/teachers', [TeacherController::class, 'store']); // Manually create an active teacher account
        Route::patch('/teachers/{teacher}/approve', [TeacherController::class, 'approve']); // Approve pending teacher registration
        Route::patch('/teachers/{teacher}/reject', [TeacherController::class, 'reject']); // Reject and remove pending registration
        Route::patch('/teachers/{teacher}/reactivate', [TeacherController::class, 'reactivate']); // Reactivate a deactivated teacher account
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']); // Deactivate an active teacher account

        // Teaching assignments management
        Route::get('/teaching-assignments', [TeacherAssignmentController::class, 'index']); // List teaching assignments with teacher, section, subject
        Route::post('/teaching-assignments', [TeacherAssignmentController::class, 'store']); // Assign a teacher to a section and subject
        Route::post('/teaching-assignments/sync', [TeacherAssignmentController::class, 'syncTeacher']); // Bulk sync teacher loads for a school year
        Route::delete('/teaching-assignments/{teaching_assignment}', [TeacherAssignmentController::class, 'destroy']); // Delete a teaching assignment
    });
});
