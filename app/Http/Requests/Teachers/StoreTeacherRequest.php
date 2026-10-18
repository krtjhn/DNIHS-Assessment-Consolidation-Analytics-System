<?php

namespace App\Http\Requests\Teachers;

use Illuminate\Foundation\Http\FormRequest;

// Form Request handling validation and authorization for directly provisioning faculty accounts by administrators
class StoreTeacherRequest extends FormRequest
{
    // Authorize only system administrators to provision faculty accounts
    public function authorize(): bool
    {
        // Enforce system_admin role requirement
        return $this->user()?->hasRole('system_admin') ?? false;
    }

    // Validation rules for verifying new faculty profile attributes
    public function rules(): array
    {
        return [
            // Full legal name of the faculty member
            'name' => ['required', 'string', 'max:255'],
            // Email address must be unique and valid
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            // Initial password must meet minimum security length of 8 characters
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    // Custom user-friendly validation error messages
    public function messages(): array
    {
        return [
            // Message when faculty name is omitted
            'name.required' => 'Faculty member full name is required.',
            // Message when email address is omitted
            'email.required' => 'Email address is required.',
            // Message when email format is invalid
            'email.email' => 'Please provide a valid email address.',
            // Message when duplicate institutional email is detected
            'email.unique' => 'An account with this email address already exists.',
            // Message when password is omitted
            'password.required' => 'Initial password is required.',
            // Message when password length is below 8 characters
            'password.min' => 'Password must be at least 8 characters long.',
        ];
    }
}
