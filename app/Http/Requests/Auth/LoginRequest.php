<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

// Form Request handling validation and authorization for user login credentials
class LoginRequest extends FormRequest
{
    // Public endpoint: Allow unauthenticated visitors to submit login credentials
    public function authorize(): bool
    {
        return true;
    }

    // Validation rules for verifying email and password inputs
    public function rules(): array
    {
        return [
            // User institutional email address must be provided and must end with @gmail.com
            'email' => ['required', 'string', 'email', 'ends_with:@gmail.com'],
            // User plaintext password must be provided
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.ends_with' => 'Please sign in with a valid @gmail.com email address.',
        ];
    }
}
