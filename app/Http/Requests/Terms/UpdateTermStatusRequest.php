<?php

namespace App\Http\Requests\Terms;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTermStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:pending,active,completed'],
        ];
    }
}
