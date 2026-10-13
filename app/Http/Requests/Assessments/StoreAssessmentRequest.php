<?php

// + Assessment Form Request

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->hasRole('teacher') || $this->user()->hasRole('system_admin'));
    }

    public function rules(): array
    {
        return [
            'school_year_id' => ['required', 'exists:school_years,id'],
            'term_id' => ['required', 'exists:terms,id'],
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
            'section_id' => [
                'required',
                Rule::exists('sections', 'id')->where(fn ($query) => $query
                    ->where('grade_level_id', $this->grade_level_id)
                    ->where('school_year_id', $this->school_year_id)
                ),
            ],
            'subject_id' => ['required', 'exists:subjects,id'],
            'type' => ['required', 'in:diagnostic,quarterly'],
            'total_items' => ['required', 'integer', 'min:1'],
            'raw_scores' => ['required', 'array', 'min:1'],
            'raw_scores.*' => ['numeric', 'min:0', 'lte:total_items'],
            'least_learned_competency' => ['nullable', 'string', 'max:1000'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'section_id.exists' => 'The selected section does not belong to the selected grade level and school year.',
            'raw_scores.*.lte' => 'Individual raw scores cannot exceed the total examination items (:value).',
        ];
    }
}
