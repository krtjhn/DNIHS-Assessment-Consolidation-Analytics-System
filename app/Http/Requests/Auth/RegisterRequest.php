<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

// Form Request handling validation and authorization for faculty self-registration
class RegisterRequest extends FormRequest
{
    // Public endpoint: Allow unauthenticated visitors to submit registration applications
    public function authorize(): bool
    {
        return true;
    }

    // Validation rules for verifying faculty applicant details
    public function rules(): array
    {
        return [
            // Full legal name of the faculty applicant
            'name' => ['required', 'string', 'max:255'],
            // Email address must be unique and valid
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            // Password must have minimum 8 characters and match the confirmation field
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            // Optional role specification, restricted to teacher or system_admin
            'role' => ['nullable', 'string', 'in:teacher,system_admin'],
        ];
    }

    // Custom user-friendly validation error messages
    public function messages(): array
    {
        return [
            'email.email' => 'Please provide a valid email address.',
        ];
    }
}
