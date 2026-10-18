<?php

namespace App\Http\Requests\Sections;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Form Request handling validation and authorization for creating class sections
class StoreSectionRequest extends FormRequest
{
    // Authorize only system administrators to manage section creation
    public function authorize(): bool
    {
        // Block non-administrator faculty members from creating sections
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    // Validation rules for adding a new section
    public function rules(): array
    {
        return [
            // Ensure school year exists in school_years table
            'school_year_id' => ['required', 'exists:school_years,id'],
            // Ensure grade level exists in grade_levels table
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
            // Enforce section name composite uniqueness: no duplicate section names within the same grade and academic year
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')->where(fn ($query) => $query
                    ->where('school_year_id', $this->school_year_id)
                    ->where('grade_level_id', $this->grade_level_id)
                ),
            ],
            // Optional boolean indicating whether section is currently active
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
