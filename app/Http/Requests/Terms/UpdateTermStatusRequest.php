<?php

namespace App\Http\Requests\Terms;

use Illuminate\Foundation\Http\FormRequest;

// Form Request handling validation and authorization for modifying academic term calendar status
class UpdateTermStatusRequest extends FormRequest
{
    // Authorize only system administrators to toggle term status
    public function authorize(): bool
    {
        // Enforce system_admin role requirement
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    // Validation rules for switching academic term status
    public function rules(): array
    {
        return [
            // Status must match one of the three recognized calendar states: pending (locked), active (open), or completed (locked)
            'status' => ['required', 'string', 'in:pending,active,completed'],
        ];
    }
}
