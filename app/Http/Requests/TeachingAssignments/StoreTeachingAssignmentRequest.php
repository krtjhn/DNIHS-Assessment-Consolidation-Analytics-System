<?php

namespace App\Http\Requests\TeachingAssignments;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Form request for validating a new teaching assignment created by an admin
class StoreTeachingAssignmentRequest extends FormRequest
{
    // Only system admins can create teaching assignments
    public function authorize(): bool
    {
        return $this->user()?->hasRole('system_admin') ?? false; // Restrict to system_admin
    }

    // Validation rules for assigning a teacher to a class
    public function rules(): array
    {
        return [
            // Teacher user ID must exist, be active, approved, and have the teacher role
            'user_id' => [
                'required', // Mandatory field
                'integer', // Must be an integer id
                Rule::exists('users', 'id')->where('is_active', true)->where('approval_status', 'approved'), // Must be active and approved
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if ($user && ! $user->hasRole('teacher')) {
                        $fail('The selected user must have the teacher role to receive class assignments.'); // Role check fail
                    }
                },
            ],
            'school_year_id' => ['required', 'integer', 'exists:school_years,id'], // Must exist in school_years table
            'section_id' => ['required', 'integer', 'exists:sections,id'], // Must exist in sections table
            'subject_id' => ['required', 'integer', 'exists:subjects,id'], // Must exist in subjects table
            'effective_from' => ['nullable', 'date'], // Optional assignment start date
        ];
    }

    // Custom error messages
    public function messages(): array
    {
        return [
            'user_id.exists' => 'The assigned faculty account must be active and approved.', // Inactive/unapproved teacher error
        ];
    }
}
