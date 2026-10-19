<?php

namespace App\Http\Requests\Terms;

use Illuminate\Foundation\Http\FormRequest;

// Form request for updating the status of an academic term
class UpdateTermStatusRequest extends FormRequest
{
    // Only system admins can change term status
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin'); // Restrict to system_admin
    }

    // Validation rules for changing term status
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:pending,active,completed'], // Must be pending, active, or completed
        ];
    }
}
