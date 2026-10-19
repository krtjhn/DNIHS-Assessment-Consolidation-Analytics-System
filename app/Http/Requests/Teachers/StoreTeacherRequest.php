<?php

namespace App\Http\Requests\Teachers;

use Illuminate\Foundation\Http\FormRequest;

// Form request for validating new teacher account creation by admin
class StoreTeacherRequest extends FormRequest
{
    // Only system admins can create teacher accounts directly
    public function authorize(): bool
    {
        return $this->user()?->hasRole('system_admin') ?? false; // Restrict to system_admin
    }

    // Validation rules for teacher account details
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'], // Full legal name of the faculty member
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'], // Valid and unique email address
            'password' => ['required', 'string', 'min:8'], // Minimum 8 character password
        ];
    }

    // Custom error messages
    public function messages(): array
    {
        return [
            'name.required' => 'Faculty member full name is required.', // Missing name error
            'email.required' => 'Email address is required.', // Missing email error
            'email.email' => 'Please provide a valid email address.', // Invalid email error
            'email.unique' => 'An account with this email address already exists.', // Duplicate email error
            'password.required' => 'Initial password is required.', // Missing password error
            'password.min' => 'Password must be at least 8 characters long.', // Short password error
        ];
    }
}
