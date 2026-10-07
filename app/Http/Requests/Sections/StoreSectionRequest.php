<?php

// + Section Form Request

namespace App\Http\Requests\Sections;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    public function rules(): array
    {
        return [
            'school_year_id' => ['required', 'exists:school_years,id'],
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')->where(fn ($query) => $query
                    ->where('school_year_id', $this->school_year_id)
                    ->where('grade_level_id', $this->grade_level_id)
                ),
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
