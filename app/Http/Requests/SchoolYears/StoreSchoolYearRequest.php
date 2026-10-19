<?php

namespace App\Http\Requests\SchoolYears;

use Illuminate\Foundation\Http\FormRequest;

// Validates requests to create a new school year
class StoreSchoolYearRequest extends FormRequest
{
    // Only administrators can create school years
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin'); // Restrict to system_admin
    }

    // Rules for school year creation
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:20', 'unique:school_years,name'], // Academic year name (e.g. 2025-2026)
            'start_date' => ['required', 'date'], // School year start date
            'end_date' => ['required', 'date', 'after:start_date'], // Must occur after start_date
            'is_active' => ['sometimes', 'boolean'], // Active year flag
        ];
    }
}
