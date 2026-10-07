<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;

class AcademicReferenceController extends Controller
{
    public function referenceData(): JsonResponse
    {
        return response()->json([
            'grade_levels' => GradeLevel::orderBy('level')->get(),
            'subjects' => Subject::where('is_active', true)->orderBy('name')->get(['id', 'name', 'grade_level_id', 'is_active']),
            'school_years' => SchoolYear::with('terms')->orderBy('id', 'desc')->get(),
            'active_sy' => SchoolYear::active()->with('terms')->first(),
        ]);
    }
}
