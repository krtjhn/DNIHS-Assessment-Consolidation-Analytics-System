<?php

// + Assessment Form Request

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->hasRole('teacher') || $this->user()->hasRole('system_admin'));
    }

    public function rules(): array
    {
        return [
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
            'raw_scores.*.lte' => 'Individual raw scores cannot exceed the total examination items (:value).',
        ];
    }
}
