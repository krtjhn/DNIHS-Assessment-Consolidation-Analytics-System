<?php

namespace App\Http\Requests\SchoolYears;

use App\Models\SchoolYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Form Request handling validation and authorization for modifying academic school year records
class UpdateSchoolYearRequest extends FormRequest
{
    // Authorize only system administrators to modify school years
    public function authorize(): bool
    {
        // Enforce system_admin role requirement
        return $this->user() && $this->user()->hasRole('system_admin');
    }

    // Validation rules for updating a school year
    public function rules(): array
    {
        // Resolve school year model or ID from the active route parameter
        $schoolYearId = $this->route('school_year') instanceof SchoolYear
            ? $this->route('school_year')->id
            : $this->route('school_year') ?? $this->route('id');

        return [
            // Ensure unique school year designation while ignoring the current record ID
            'name' => [
                'required',
                'string',
                'max:20',
                // Ignore current school year ID to allow saving without modifying the name
                Rule::unique('school_years', 'name')->ignore($schoolYearId),
            ],
            // Academic year start date
            'start_date' => ['required', 'date'],
            // Academic year end date, must be chronologically after start_date
            'end_date' => ['required', 'date', 'after:start_date'],
            // Optional boolean indicating whether this school year is currently active
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
