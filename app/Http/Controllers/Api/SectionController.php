<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sections\StoreSectionRequest;
use App\Http\Requests\Sections\UpdateSectionRequest;
use App\Http\Resources\SectionResource;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Section Controller managing class sections, grade-level allocations, and historical assessment retention safeguards
class SectionController extends Controller
{
    // List all sections filtered optionally by school year or grade level
    public function index(Request $request): JsonResponse
    {
        // Build section query with eager-loaded gradeLevel and schoolYear relationships
        $query = Section::with(['gradeLevel', 'schoolYear'])
            // Filter by school year if provided in query string
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->school_year_id))
            // Filter by grade level if provided in query string
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->grade_level_id));

        // Execute query ordered hierarchically by grade level and alphabetically by section name
        $sections = $query->orderBy('grade_level_id')->orderBy('name')->get();

        // Return formatted collection of sections wrapped in SectionResource
        return response()->json([
            'data' => SectionResource::collection($sections),
        ]);
    }

    // Create a new section under a specific grade level and school year
    public function store(StoreSectionRequest $request): JsonResponse
    {
        // Persist validated section data into the database
        $section = Section::create($request->validated());

        // Return 201 Created response with newly created section and loaded relationships
        return response()->json([
            'message' => 'Section created successfully.',
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])),
        ], 201);
    }

    // View specific section details and academic relationships
    public function show(Section $section): JsonResponse
    {
        // Return single section resource with loaded grade level and school year models
        return response()->json([
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])),
        ]);
    }

    // Update section name or active status
    public function update(UpdateSectionRequest $request, Section $section): JsonResponse
    {
        // Update section attributes using validated input from UpdateSectionRequest
        $section->update($request->validated());

        // Return success response with updated section resource
        return response()->json([
            'message' => 'Section updated successfully.',
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])),
        ]);
    }

    // Delete section, preventing deletion if historical assessment records exist
    public function destroy(Section $section): JsonResponse
    {
        // Integrity safeguard: Check if section contains existing student assessment score sheets
        if ($section->assessmentRecords()->exists()) {
            // Reject deletion with HTTP 422 to protect historical academic records from accidental data loss
            return response()->json([
                'message' => 'Cannot delete section because it contains recorded assessment scores. Archive or deactivate the section instead to preserve historical records.',
            ], 422);
        }

        // Permanently delete section if no assessment records depend on it
        $section->delete();

        // Return success message confirming deletion
        return response()->json([
            'message' => 'Section deleted successfully.',
        ]);
    }
}
