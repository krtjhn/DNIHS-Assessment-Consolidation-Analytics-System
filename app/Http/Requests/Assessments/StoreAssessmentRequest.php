<?php

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Form Request handling validation and authorization for encoding new student assessment records
class StoreAssessmentRequest extends FormRequest
{
    // Authorize authenticated teachers and system administrators to encode assessment score sheets
    public function authorize(): bool
    {
        // Require active login and either teacher or system_admin role
        return $this->user() && ($this->user()->hasRole('teacher') || $this->user()->hasRole('system_admin'));
    }

    // Define comprehensive validation rules for assessment score encoding
    public function rules(): array
    {
        return [
            // Ensure school year exists in school_years table
            'school_year_id' => ['required', 'exists:school_years,id'],
            // Ensure academic term exists in terms table
            'term_id' => ['required', 'exists:terms,id'],
            // Ensure grade level exists in grade_levels table
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
            // Enforce relational integrity: section must strictly belong to the selected grade level and school year
            'section_id' => [
                'required',
                Rule::exists('sections', 'id')->where(fn ($query) => $query
                    ->where('grade_level_id', $this->grade_level_id)
                    ->where('school_year_id', $this->school_year_id)
                ),
            ],
            // Ensure subject exists in subjects table
            'subject_id' => ['required', 'exists:subjects,id'],
            // Restrict assessment type to official DepEd assessment classifications
            'type' => ['required', 'in:diagnostic,term_exam'],
            // Total test items must be a positive integer of at least 1
            'total_items' => ['required', 'integer', 'min:1'],
            // Raw scores must be provided as a non-empty array of examinee entries
            'raw_scores' => ['required', 'array', 'min:1'],
            // Mathematical safeguard: each student's raw score must be non-negative and cannot exceed total test items
            'raw_scores.*' => ['numeric', 'min:0', 'lte:total_items'],
            // Optional least learned competency text for diagnostic remediation
            'least_learned_competency' => ['nullable', 'string', 'max:1000'],
            // Optional teacher administrative remarks
            'remarks' => ['nullable', 'string', 'max:255'],
        ];
    }

    // Provide clear, informative error messages for validation failures
    public function messages(): array
    {
        return [
            // Specific feedback when section does not match the chosen grade level or academic year
            'section_id.exists' => 'The selected section does not belong to the selected grade level and school year.',
            // Specific feedback when a student score exceeds the maximum possible score
            'raw_scores.*.lte' => 'Individual raw scores cannot exceed the total examination items (:value).',
        ];
    }
}
