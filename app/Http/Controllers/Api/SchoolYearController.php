<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SchoolYears\StoreSchoolYearRequest;
use App\Http\Requests\SchoolYears\UpdateSchoolYearRequest;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

// School Year Controller managing academic calendar years, single-active calendar invariants, and automatic term initialization
class SchoolYearController extends Controller
{
    // Retrieve all registered school years with their corresponding academic terms
    public function index(): JsonResponse
    {
        // Query school years with terms eager-loaded, sorted with most recent academic years first
        $schoolYears = SchoolYear::with('terms')
            ->orderBy('start_date', 'desc')
            ->orderBy('name', 'desc')
            ->get();

        // Return collection of school years as JSON response
        return response()->json([
            'data' => $schoolYears,
        ]);
    }

    // Create a new school year, manage the active year invariant, and auto-generate its 3 terms
    public function store(StoreSchoolYearRequest $request): JsonResponse
    {
        // Extract validated school year attributes from StoreSchoolYearRequest
        $validated = $request->validated();

        // Perform calendar initialization within a database transaction
        $schoolYear = DB::transaction(function () use ($validated) {
            // Invariant check: If the new school year is designated as active, deactivate any previously active school year
            if (! empty($validated['is_active']) && $validated['is_active']) {
                SchoolYear::where('is_active', true)->update(['is_active' => false]);
            }

            // Create the school year record
            $sy = SchoolYear::create($validated);

            // Automatically generate the three standard academic terms initialized with pending status
            $sy->terms()->createMany([
                ['term_number' => 1, 'name' => 'First Term', 'status' => 'pending'],
                ['term_number' => 2, 'name' => 'Second Term', 'status' => 'pending'],
                ['term_number' => 3, 'name' => 'Third Term', 'status' => 'pending'],
            ]);

            return $sy;
        });

        // Return 201 Created response containing newly created school year and initialized terms
        return response()->json([
            'message' => 'School year and terms created successfully.',
            'data' => $schoolYear->load('terms'),
        ], 201);
    }

    // Retrieve specific school year details along with its associated academic terms
    public function show(SchoolYear $school_year): JsonResponse
    {
        // Return single school year resource with loaded terms relation
        return response()->json([
            'data' => $school_year->load('terms'),
        ]);
    }

    // Update school year details and manage active calendar flags
    public function update(UpdateSchoolYearRequest $request, SchoolYear $school_year): JsonResponse
    {
        // Extract validated update attributes from UpdateSchoolYearRequest
        $validated = $request->validated();

        // Execute updates inside a database transaction
        DB::transaction(function () use ($validated, $school_year) {
            // Invariant check: If marked active, ensure all other school years are set to inactive
            if (! empty($validated['is_active']) && $validated['is_active']) {
                SchoolYear::where('id', '!=', $school_year->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            // Update school year attributes
            $school_year->update($validated);
        });

        // Return success response with updated school year model
        return response()->json([
            'message' => 'School year updated successfully.',
            'data' => $school_year->load('terms'),
        ]);
    }

    // Delete an inactive school year if no sections or assessments are linked
    public function destroy(SchoolYear $school_year): JsonResponse
    {
        // Guard: Prevent deletion of the currently active school year
        if ($school_year->is_active) {
            return response()->json([
                'message' => 'Active school year cannot be deleted. Deactivate or switch active school year first.',
            ], 422);
        }

        // Guard: Prevent deletion if any sections or assessment records are linked to this school year
        if ($school_year->sections()->exists() || $school_year->assessmentRecords()->exists()) {
            return response()->json([
                'message' => 'Cannot delete school year because sections or assessments are already linked to it.',
            ], 422);
        }

        // Execute deletion within database transaction
        DB::transaction(function () use ($school_year) {
            // Delete dependent terms first
            $school_year->terms()->delete();
            // Delete the school year
            $school_year->delete();
        });

        // Return confirmation that school year was removed
        return response()->json([
            'message' => 'School year deleted successfully.',
        ]);
    }
}
