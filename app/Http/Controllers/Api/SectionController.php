<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
// + Section Requests mula sa subfolder
use App\Http\Requests\Sections\StoreSectionRequest;
use App\Http\Requests\Sections\UpdateSectionRequest;
use App\Http\Resources\SectionResource;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    /**
     * READ: List all sections with Grade Level and School Year.
     * GET /api/sections
     */
    public function index(Request $request): JsonResponse
    {
        $query = Section::with(['gradeLevel', 'schoolYear'])
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->school_year_id))
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->grade_level_id));

        $sections = $query->orderBy('grade_level_id')->orderBy('name')->get();

        return response()->json([
            'data' => SectionResource::collection($sections),
        ]);
    }

    /**
     * CREATE: Add a new section (Admin Only).
     * POST /api/sections
     */
    public function store(StoreSectionRequest $request): JsonResponse
    {
        $section = Section::create($request->validated());

        return response()->json([
            'message' => 'Section created successfully.',
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])),
        ], 201);
    }

    /**
     * READ: View single section details.
     * GET /api/sections/{section}
     */
    public function show(Section $section): JsonResponse
    {
        return response()->json([
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])),
        ]);
    }

    /**
     * UPDATE: Edit section name or active status (Admin Only).
     * PUT /api/sections/{section}
     */
    public function update(UpdateSectionRequest $request, Section $section): JsonResponse
    {
        $section->update($request->validated());

        return response()->json([
            'message' => 'Section updated successfully.',
            'data' => new SectionResource($section->load(['gradeLevel', 'schoolYear'])),
        ]);
    }

    /**
     * DELETE: Remove section (Admin Only).
     * DELETE /api/sections/{section}
     */
    public function destroy(Section $section): JsonResponse
    {
        $section->delete();

        return response()->json([
            'message' => 'Section deleted successfully.',
        ]);
    }
}
