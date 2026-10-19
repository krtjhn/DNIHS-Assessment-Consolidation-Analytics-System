<?php

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validates incoming score sheet data when saving a new assessment
class StoreAssessmentRequest extends FormRequest
{
    // Allow teachers and administrators to submit scores
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->hasRole('teacher') || $this->user()->hasRole('system_admin')); // Authorized roles
    }

    // Validation rules for score sheet inputs
    public function rules(): array
    {
        return [
            'school_year_id' => ['required', 'exists:school_years,id'], // Must exist in school_years table
            'term_id' => ['required', 'exists:terms,id'], // Must exist in terms table
            'grade_level_id' => ['required', 'exists:grade_levels,id'], // Must exist in grade_levels table
            // Section must belong to the selected grade level and school year
            'section_id' => [
                'required',
                Rule::exists('sections', 'id')->where(fn ($query) => $query
                    ->where('grade_level_id', $this->grade_level_id)
                    ->where('school_year_id', $this->school_year_id)
                ),
            ],
            'subject_id' => ['required', 'exists:subjects,id'], // Must exist in subjects table
            'type' => ['required', 'in:diagnostic,term_exam'], // Examination milestone type
            'total_items' => ['required', 'integer', 'min:1'], // Maximum test items count
            'raw_scores' => ['required', 'array', 'min:1'], // Array containing student raw scores
            'raw_scores.*' => ['numeric', 'min:0', 'lte:total_items'], // Each score cannot exceed total items
            'least_learned_competency' => ['nullable', 'string', 'max:1000'], // Identified weak learning competency
            'remarks' => ['nullable', 'string', 'max:255'], // Teacher comments or notes
        ];
    }

    // Custom error messages
    public function messages(): array
    {
        return [
            'section_id.exists' => 'The selected section does not belong to the selected grade level and school year.', // Section mismatch error
            'raw_scores.*.lte' => 'Individual raw scores cannot exceed the total examination items (:value).', // Score limit error
        ];
    }
}
