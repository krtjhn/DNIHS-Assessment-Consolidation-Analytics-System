<?php

namespace App\Http\Requests\Sections;

use App\Models\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validates requests to update a class section
class UpdateSectionRequest extends FormRequest
{
    // Only administrators can edit sections
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin'); // Restrict to system_admin
    }

    // Rules for section updates
    public function rules(): array
    {
        $section = $this->route('section'); // Retrieve section parameter from route
        $sectionModel = $section instanceof Section ? $section : Section::find($section); // Ensure model instance

        $schoolYearId = $sectionModel?->school_year_id ?? $this->school_year_id; // Scope school year id
        $gradeLevelId = $sectionModel?->grade_level_id ?? $this->grade_level_id; // Scope grade level id
        $sectionId = $sectionModel?->id ?? $section; // Current section id to ignore

        return [
            // Name must remain unique in the same grade and school year, ignoring the current record
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')
                    ->where(fn ($query) => $query
                        ->where('school_year_id', $schoolYearId)
                        ->where('grade_level_id', $gradeLevelId)
                    )
                    ->ignore($sectionId), // Ignore current section id during uniqueness check
            ],
            'is_active' => ['nullable', 'boolean'], // Optional active flag
        ];
    }

    // Custom error messages
    public function messages(): array
    {
        return [
            'name.unique' => 'A section with this name already exists in the same grade level and school year.', // Duplicate section error
        ];
    }
}
