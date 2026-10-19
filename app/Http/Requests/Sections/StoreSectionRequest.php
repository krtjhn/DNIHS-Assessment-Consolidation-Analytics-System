<?php

namespace App\Http\Requests\Sections;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validates requests to create a new class section
class StoreSectionRequest extends FormRequest
{
    // Only administrators can create sections
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin'); // Restrict to system_admin
    }

    // Rules for section creation
    public function rules(): array
    {
        return [
            'school_year_id' => ['required', 'exists:school_years,id'], // Must exist in school_years table
            'grade_level_id' => ['required', 'exists:grade_levels,id'], // Must exist in grade_levels table
            // Section name must be unique within the same grade and school year
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')->where(fn ($query) => $query
                    ->where('school_year_id', $this->school_year_id)
                    ->where('grade_level_id', $this->grade_level_id)
                ), // Avoid duplicate section names within the same grade and year
            ],
            'is_active' => ['nullable', 'boolean'], // Optional active flag
        ];
    }
}
