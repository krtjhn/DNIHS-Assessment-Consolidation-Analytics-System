<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SchoolYears\StoreSchoolYearRequest;
use App\Http\Requests\SchoolYears\UpdateSchoolYearRequest;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SchoolYearController extends Controller
{
    /**
     * GET /api/school-years
     * List school years with their terms.
     */
    public function index(): JsonResponse
    {
        $schoolYears = SchoolYear::with('terms')
            ->orderBy('start_date', 'desc')
            ->orderBy('name', 'desc')
            ->get();

        return response()->json([
            'data' => $schoolYears,
        ]);
    }

    /**
     * POST /api/school-years (Admin only)
     * Create a school year and its three terms.
     */
    public function store(StoreSchoolYearRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolYear = DB::transaction(function () use ($validated) {
            // Only one school year may be active.
            if (! empty($validated['is_active']) && $validated['is_active']) {
                SchoolYear::where('is_active', true)->update(['is_active' => false]);
            }

            // Create the school year.
            $sy = SchoolYear::create($validated);

            // Create the three terms for this school year.
            $sy->terms()->createMany([
                ['term_number' => 1, 'name' => 'First Term', 'status' => 'pending'],
                ['term_number' => 2, 'name' => 'Second Term', 'status' => 'pending'],
                ['term_number' => 3, 'name' => 'Third Term', 'status' => 'pending'],
            ]);

            return $sy;
        });

        return response()->json([
            'message' => 'School year and terms created successfully.',
            'data' => $schoolYear->load('terms'),
        ], 201);
    }

    /**
     * GET /api/school-years/{school_year}
     * Display a school year.
     */
    public function show(SchoolYear $school_year): JsonResponse
    {
        return response()->json([
            'data' => $school_year->load('terms'),
        ]);
    }

    /**
     * PUT /api/school-years/{school_year} (Admin only)
     * Update a school year.
     */
    public function update(UpdateSchoolYearRequest $request, SchoolYear $school_year): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $school_year) {
            // Deactivate other school years when this one becomes active.
            if (! empty($validated['is_active']) && $validated['is_active']) {
                SchoolYear::where('id', '!=', $school_year->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $school_year->update($validated);
        });

        return response()->json([
            'message' => 'School year updated successfully.',
            'data' => $school_year->load('terms'),
        ]);
    }

    /**
     * DELETE /api/school-years/{school_year} (Admin only)
     * Delete an inactive school year if no sections or assessments are linked.
     */
    public function destroy(SchoolYear $school_year): JsonResponse
    {
        if ($school_year->is_active) {
            return response()->json([
                'message' => 'Active school year cannot be deleted. Deactivate or switch active school year first.',
            ], 422);
        }

        if ($school_year->sections()->exists() || $school_year->assessmentRecords()->exists()) {
            return response()->json([
                'message' => 'Cannot delete school year because sections or assessments are already linked to it.',
            ], 422);
        }

        DB::transaction(function () use ($school_year) {
            $school_year->terms()->delete();
            $school_year->delete();
        });

        return response()->json([
            'message' => 'School year deleted successfully.',
        ]);
    }
}
