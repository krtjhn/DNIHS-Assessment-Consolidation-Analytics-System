<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SchoolYears\StoreSchoolYearRequest;
use App\Http\Requests\SchoolYears\UpdateSchoolYearRequest;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// Manages school years, active calendar status, and terms
class SchoolYearController extends Controller
{
    // List all school years with their terms
    public function index(): JsonResponse
    {
        $schoolYears = SchoolYear::with('terms') // Eager load terms
            ->orderBy('start_date', 'desc') // Sort newest first
            ->orderBy('name', 'desc') // Secondary sort by name
            ->get(); // Retrieve collection

        return response()->json([
            'data' => $schoolYears, // Return array of school years
        ]);
    }

    // Create a new school year and auto-generate its 3 terms
    public function store(StoreSchoolYearRequest $request): JsonResponse
    {
        $validated = $request->validated(); // Get validated data

        $schoolYear = DB::transaction(function () use ($validated) {
            // If this school year is set as active, deactivate all other school years
            if (! empty($validated['is_active'])) {
                SchoolYear::where('is_active', true)->update(['is_active' => false]); // Deactivate other years
            }

            $sy = SchoolYear::create($validated); // Create new school year

            // Automatically create 1st, 2nd, and 3rd terms with pending status
            $sy->terms()->createMany([
                ['term_number' => 1, 'name' => '1st Term', 'status' => 'pending'], // 1st term
                ['term_number' => 2, 'name' => '2nd Term', 'status' => 'pending'], // 2nd term
                ['term_number' => 3, 'name' => '3rd Term', 'status' => 'pending'], // 3rd term
            ]);

            return $sy; // Return created model
        });

        Cache::store('file')->forget('academic_reference_data'); // Clear cached reference data

        return response()->json([
            'message' => 'School year and terms created successfully.', // Success message
            'data' => $schoolYear->load('terms'), // Return model with terms
        ], 201);
    }

    // View a single school year with its terms
    public function show(SchoolYear $school_year): JsonResponse
    {
        return response()->json([
            'data' => $school_year->load('terms'), // Return school year with terms
        ]);
    }

    // Update school year details and active status
    public function update(UpdateSchoolYearRequest $request, SchoolYear $school_year): JsonResponse
    {
        $validated = $request->validated(); // Get validated data

        DB::transaction(function () use ($validated, $school_year) {
            // If set as active, ensure all other school years are set to inactive
            if (! empty($validated['is_active'])) {
                SchoolYear::where('id', '!=', $school_year->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]); // Deactivate conflicting active years
            }

            $school_year->update($validated); // Save updates
        });

        Cache::store('file')->forget('academic_reference_data'); // Clear cached reference data

        return response()->json([
            'message' => 'School year updated successfully.', // Success message
            'data' => $school_year->load('terms'), // Return updated model with terms
        ]);
    }

    // Delete an inactive school year if no classes or scores are linked to it
    public function destroy(SchoolYear $school_year): JsonResponse
    {
        // Do not allow deleting the active school year
        if ($school_year->is_active) {
            return response()->json([
                'message' => 'Active school year cannot be deleted. Deactivate or switch active school year first.', // Validation error
            ], 422);
        }

        // Do not allow deleting if sections or scores are linked
        if ($school_year->sections()->exists() || $school_year->assessmentRecords()->exists()) {
            return response()->json([
                'message' => 'Cannot delete school year because sections or assessments are already linked to it.', // Data integrity error
            ], 422);
        }

        DB::transaction(function () use ($school_year) {
            $school_year->terms()->delete(); // Delete terms under this year
            $school_year->delete(); // Soft delete school year record
        });

        Cache::store('file')->forget('academic_reference_data'); // Clear cached reference data

        return response()->json([
            'message' => 'School year deleted successfully.', // Deletion confirmation
        ]);
    }
}
