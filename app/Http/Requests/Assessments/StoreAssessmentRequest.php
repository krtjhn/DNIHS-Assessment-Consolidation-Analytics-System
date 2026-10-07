<?php

// + Assessment Form Request

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('teacher');
    }

    public function rules(): array
    {
        return [
            'school_year_id' => ['required', 'exists:school_years,id'],
            'term_id' => ['required', 'exists:terms,id'],
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'type' => ['required', 'in:diagnostic,quarterly'],
            'total_items' => ['required', 'integer', 'min:1'],
            'raw_scores' => ['required', 'array', 'min:1'],
            'raw_scores.*' => ['numeric', 'min:0'],
            'least_learned_competency' => ['nullable', 'string', 'max:1000'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ];
    }
}
