<?php

namespace App\Http\Requests\Sections;

use App\Models\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Form Request handling validation and authorization for updating section attributes
class UpdateSectionRequest extends FormRequest
{
    // Authorize only system administrators to modify class sections
    public function authorize(): bool
    {
        // Block non-administrator faculty members from updating sections
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    // Validation rules for updating section name and active status
    public function rules(): array
    {
        // Resolve target section model from route parameter
        $section = $this->route('section');
        $sectionModel = $section instanceof Section ? $section : Section::find($section);

        // Extract school year and grade level IDs for composite uniqueness checking
        $schoolYearId = $sectionModel?->school_year_id ?? $this->school_year_id;
        $gradeLevelId = $sectionModel?->grade_level_id ?? $this->grade_level_id;
        $sectionId = $sectionModel?->id ?? $section;

        return [
            // Ensure unique section name within the same grade and academic year, ignoring the section being updated
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')
                    ->where(fn ($query) => $query
                        ->where('school_year_id', $schoolYearId)
                        ->where('grade_level_id', $gradeLevelId)
                    )
                    // Exclude current section ID from uniqueness check to permit saving without renaming
                    ->ignore($sectionId),
            ],
            // Optional boolean status indicating whether the section is active
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    // Provide clear error message when duplicate section name is detected
    public function messages(): array
    {
        return [
            // Specific feedback when renaming causes a naming collision within the same cohort
            'name.unique' => 'A section with this name already exists in the same grade level and school year.',
        ];
    }
}
