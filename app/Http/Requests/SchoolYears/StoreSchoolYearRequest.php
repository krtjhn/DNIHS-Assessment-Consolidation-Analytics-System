<?php

namespace App\Http\Requests\SchoolYears;

use Illuminate\Foundation\Http\FormRequest;

// Form Request handling validation and authorization for creating a new academic school year
class StoreSchoolYearRequest extends FormRequest
{
    // Authorize only system administrators to configure school years
    public function authorize(): bool
    {
        // Enforce system_admin role requirement
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    // Validation rules for adding a new school year
    public function rules(): array
    {
        return [
            // School year designation (e.g. 2025-2026), must be unique in school_years table
            'name' => ['required', 'string', 'max:20', 'unique:school_years,name'],
            // Official start date of academic calendar year
            'start_date' => ['required', 'date'],
            // Concluding date of academic calendar year, must chronologically follow start_date
            'end_date' => ['required', 'date', 'after:start_date'],
            // Optional boolean status indicating if this school year is currently active
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
