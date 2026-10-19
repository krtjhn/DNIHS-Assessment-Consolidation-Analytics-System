<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

// Provides reference data like grade levels, subjects, and school years for UI dropdowns
class AcademicReferenceController extends Controller
{
    // Return all reference data needed by frontend forms and filters
    public function referenceData(): JsonResponse
    {
        // Cache data for 1 hour to improve load speed
        $data = Cache::store('file')->remember('academic_reference_data', 3600, function () {
            return [
                'grade_levels' => GradeLevel::orderBy('level')->get()->toArray(), // Junior high grade levels (7 to 10)
                'subjects' => Subject::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'grade_level_id', 'is_active'])->toArray(), // Active subjects list
                'school_years' => SchoolYear::with('terms')->orderBy('id', 'desc')->get()->toArray(), // School years with terms
                'active_sy' => SchoolYear::active()->with('terms')->first()?->toArray(), // Currently active school year
            ];
        });

        return response()->json($data); // Return reference data JSON response
    }
}
