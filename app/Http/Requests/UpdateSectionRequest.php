<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}