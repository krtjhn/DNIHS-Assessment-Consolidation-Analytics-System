<?php

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;

// Form Request handling validation and authorization for modifying existing assessment score sheets
class UpdateAssessmentRequest extends FormRequest
{
    // Authorize authenticated teachers and system administrators to update assessment records
    public function authorize(): bool
    {
        // Require active login and either teacher or system_admin role
        return $this->user() && ($this->user()->hasRole('teacher') || $this->user()->hasRole('system_admin'));
    }

    // Validation rules for updating raw scores and associated competencies
    public function rules(): array
    {
        return [
            // Total test items must be a positive integer of at least 1
            'total_items' => ['required', 'integer', 'min:1'],
            // Updated raw scores array must contain at least one examinee entry
            'raw_scores' => ['required', 'array', 'min:1'],
            // Score injection safeguard: raw scores must be non-negative and cannot exceed total test items
            'raw_scores.*' => ['numeric', 'min:0', 'lte:total_items'],
            // Optional updated least learned competency text
            'least_learned_competency' => ['nullable', 'string', 'max:1000'],
            // Optional updated teacher remarks
            'remarks' => ['nullable', 'string', 'max:255'],
        ];
    }

    // Custom validation error message for upper-bound score ceiling violations
    public function messages(): array
    {
        return [
            // Specific feedback when a student score exceeds the maximum possible score
            'raw_scores.*.lte' => 'Individual raw scores cannot exceed the total examination items (:value).',
        ];
    }
}
