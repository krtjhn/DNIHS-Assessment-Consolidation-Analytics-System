<?php

namespace App\Http\Requests\TeachingAssignments;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Form Request handling validation and authorization for synchronizing a faculty member's complete workload schedule
class SyncTeachingAssignmentRequest extends FormRequest
{
    // Authorize only system administrators to batch-synchronize teaching workloads
    public function authorize(): bool
    {
        // Enforce system_admin role requirement
        return $this->user()?->hasRole('system_admin') ?? false;
    }

    // Validation rules for synchronizing a teacher's full workload matrix
    public function rules(): array
    {
        return [
            // Target faculty user must exist, be active and approved, and possess the teacher role
            'user_id' => [
                'required',
                'integer',
                // Verify user exists with active and approved status
                Rule::exists('users', 'id')->where('is_active', true)->where('approval_status', 'approved'),
                // Custom rule callback verifying that the user is officially assigned the teacher role
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if ($user && ! $user->hasRole('teacher')) {
                        $fail('The selected user must have the teacher role to receive class assignments.');
                    }
                },
            ],
            // Ensure target school year exists in school_years table
            'school_year_id' => ['required', 'integer', 'exists:school_years,id'],
            // The assignments array must be present in request payload, even if empty (to allow clearing loads)
            'assignments' => ['present', 'array'],
            // Each individual assignment entry must specify an existing class section ID
            'assignments.*.section_id' => ['required', 'integer', 'exists:sections,id'],
            // Each individual assignment entry must specify an existing subject ID
            'assignments.*.subject_id' => ['required', 'integer', 'exists:subjects,id'],
            // Optional effective start date for newly synced assignments
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
