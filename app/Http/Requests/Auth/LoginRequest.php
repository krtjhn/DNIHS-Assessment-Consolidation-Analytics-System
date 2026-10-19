<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

// Validates login credentials
class LoginRequest extends FormRequest
{
    // Anyone can attempt to log in
    public function authorize(): bool
    {
        return true; // Public access
    }

    // Rules for email and password inputs
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'], // Valid user email address
            'password' => ['required', 'string'], // User password
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
