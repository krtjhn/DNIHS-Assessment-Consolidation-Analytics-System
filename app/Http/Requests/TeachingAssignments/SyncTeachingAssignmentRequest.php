<?php

namespace App\Http\Requests\TeachingAssignments;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncTeachingAssignmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('system_admin') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('is_active', true)->where('approval_status', 'approved'),
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if ($user && ! $user->hasRole('teacher')) {
                        $fail('The selected user must have the teacher role to receive class assignments.');
                    }
                },
            ],
            'school_year_id' => ['required', 'integer', 'exists:school_years,id'],
            'assignments' => ['present', 'array'],
            'assignments.*.section_id' => ['required', 'integer', 'exists:sections,id'],
            'assignments.*.subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'effective_from' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.exists' => 'The assigned faculty account must be active and approved.',
        ];
    }
}
