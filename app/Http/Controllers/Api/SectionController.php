<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sections\StoreSectionRequest;
use App\Http\Requests\Sections\UpdateSectionRequest;
use App\Http\Resources\SectionResource;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Manages class sections and ensures sections with scores cannot be deleted
class SectionController extends Controller
{
    // List all sections with optional filters for school year and grade level
    public function index(Request $request): JsonResponse
    {
        $query = Section::with(['gradeLevel', 'schoolYear']) // Eager load related grade level and school year
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->school_year_id)) // Filter by school year
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->grade_level_id)); // Filter by grade level

        $sections = $query->orderBy('grade_level_id')->orderBy('name')->get(); // Sort sections by grade then name

        return response()->json([
            'data' => SectionResource::collection($sections), // Format collection through SectionResource
        ]);
    }

    // Create a new section
    public function store(StoreSectionRequest $request): JsonResponse
    {
        $section = Section::create($request->validated()); // Create new section record

        return response()->json([
            'message' => 'Section created successfully.', // Creation confirmation
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])), // Return formatted resource
        ], 201);
    }

    // View details of a single section
    public function show(Section $section): JsonResponse
    {
        return response()->json([
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])), // Return formatted resource
        ]);
    }

    // Update section details
    public function update(UpdateSectionRequest $request, Section $section): JsonResponse
    {
        $section->update($request->validated()); // Save updated attributes

        return response()->json([
            'message' => 'Section updated successfully.', // Update confirmation
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])), // Return updated resource
        ]);
    }

    // Delete a section only if it has no recorded scores
    public function destroy(Section $section): JsonResponse
    {
        // Stop deletion if students already have scores recorded in this section
        if ($section->assessmentRecords()->exists()) {
            return response()->json([
                'message' => 'Cannot delete section because it contains recorded assessment scores. Archive or deactivate the section instead to preserve historical records.', // Data integrity guard
            ], 422);
        }

        $section->delete(); // Soft delete the section

        return response()->json([
            'message' => 'Section deleted successfully.', // Deletion confirmation
        ]);
    }
}
