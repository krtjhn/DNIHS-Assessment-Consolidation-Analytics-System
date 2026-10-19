<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

// Validates self-registration requests from new teachers
class RegisterRequest extends FormRequest
{
    // Anyone can submit a registration form
    public function authorize(): bool
    {
        return true; // Public access
    }

    // Rules for teacher registration fields
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'], // Full name of the applicant
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'], // Unique email address
            'password' => ['required', 'string', 'min:8', 'confirmed'], // Password must be at least 8 chars and confirmed
            'role' => ['nullable', 'string', 'in:teacher,system_admin'], // Requested role (defaults to teacher)
        ];
    }

    // Custom error messages
    public function messages(): array
    {
        return [
            'email.email' => 'Please provide a valid email address.', // Invalid email format message
        ];
    }
}
