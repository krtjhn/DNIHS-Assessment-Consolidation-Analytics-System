<?php

namespace App\Http\Requests\TeachingAssignments;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Form Request handling validation and authorization for allocating a teaching assignment to a faculty member
class StoreTeachingAssignmentRequest extends FormRequest
{
    // Authorize only system administrators to assign teaching workloads
    public function authorize(): bool
    {
        // Enforce system_admin role requirement
        return $this->user()?->hasRole('system_admin') ?? false;
    }

    // Validation rules for assigning a faculty workload
    public function rules(): array
    {
        return [
            // Ensure target user is active, approved, and possesses the teacher role
            'user_id' => [
                'required',
                'integer',
                // Verify user exists, has active status, and is officially approved
                Rule::exists('users', 'id')->where('is_active', true)->where('approval_status', 'approved'),
                // Custom rule callback verifying that the user is officially assigned the teacher role
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if ($user && ! $user->hasRole('teacher')) {
                        $fail('The selected user must have the teacher role to receive class assignments.');
                    }
                },
            ],
            // Ensure academic year exists in school_years table
            'school_year_id' => ['required', 'integer', 'exists:school_years,id'],
            // Ensure class section exists in sections table
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            // Ensure subject exists in subjects table
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            // Optional effective start date for assignment
            'effective_from' => ['nullable', 'date'],
        ];
    }

    // Custom user-facing error messages
    public function messages(): array
    {
        return [
            // Feedback when assigned faculty member is deactivated or pending approval
            'user_id.exists' => 'The assigned faculty account must be active and approved.',
        ];
    }
}
