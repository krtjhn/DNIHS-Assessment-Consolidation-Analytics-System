<?php

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;

// Validates updated score sheet data
class UpdateAssessmentRequest extends FormRequest
{
    // Allow teachers and administrators to update scores
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->hasRole('teacher') || $this->user()->hasRole('system_admin')); // Authorized roles
    }

    // Validation rules for updating scores
    public function rules(): array
    {
        return [
            'total_items' => ['required', 'integer', 'min:1'], // Maximum examination items count
            'raw_scores' => ['required', 'array', 'min:1'], // Updated raw score array
            'raw_scores.*' => ['numeric', 'min:0', 'lte:total_items'], // Score cannot exceed total items
            'least_learned_competency' => ['nullable', 'string', 'max:1000'], // Updated weak competency note
            'remarks' => ['nullable', 'string', 'max:255'], // Updated remarks or teacher notes
        ];
    }

    // Custom error messages
    public function messages(): array
    {
        return [
            'raw_scores.*.lte' => 'Individual raw scores cannot exceed the total examination items (:value).', // Score limit error
        ];
    }
}
