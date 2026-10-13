<?php

// + Section Form Request

namespace App\Http\Requests\Sections;

use App\Models\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    public function rules(): array
    {
        $section = $this->route('section');
        $sectionModel = $section instanceof Section ? $section : Section::find($section);

        $schoolYearId = $sectionModel?->school_year_id ?? $this->school_year_id;
        $gradeLevelId = $sectionModel?->grade_level_id ?? $this->grade_level_id;
        $sectionId = $sectionModel?->id ?? $section;

        return [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')
                    ->where(fn ($query) => $query
                        ->where('school_year_id', $schoolYearId)
                        ->where('grade_level_id', $gradeLevelId)
                    )
                    ->ignore($sectionId),
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A section with this name already exists in the same grade level and school year.',
        ];
    }
}
