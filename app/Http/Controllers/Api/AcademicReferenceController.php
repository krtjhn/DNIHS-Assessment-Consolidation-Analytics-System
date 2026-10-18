<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;

use Illuminate\Support\Facades\Cache;

// Academic Reference Controller providing foundational metadata for frontend dropdowns and filter panels
class AcademicReferenceController extends Controller
{
    // Aggregate and provide reference datasets for grade levels, curriculum subjects, and school years
    public function referenceData(): JsonResponse
    {
        // Cache foundational reference datasets on disk for 1 hour to prevent multiple round-trips to Supabase
        $data = Cache::store('file')->remember('academic_reference_data', 3600, function () {
            return [
                // Grade levels sorted sequentially (Grade 7 through 10)
                'grade_levels' => GradeLevel::orderBy('level')->get()->toArray(),
                // Active DepEd curriculum subjects sorted alphabetically
                'subjects' => Subject::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'grade_level_id', 'is_active'])->toArray(),
                // All recorded school years with their corresponding terms
                'school_years' => SchoolYear::with('terms')->orderBy('id', 'desc')->get()->toArray(),
                // The currently active school year with its corresponding active/pending terms
                'active_sy' => SchoolYear::active()->with('terms')->first()?->toArray(),
            ];
        });

        // Return structured JSON response combining all reference lists needed by frontend filters
        return response()->json($data);
    }
}
