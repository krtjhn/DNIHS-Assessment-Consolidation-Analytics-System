<?php

namespace App\Http\Requests\SchoolYears;

use App\Models\SchoolYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validates requests to update an existing school year
class UpdateSchoolYearRequest extends FormRequest
{
    // Only administrators can edit school years
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('system_admin'); // Restrict to system_admin
    }

    // Rules for school year updates
    public function rules(): array
    {
        $schoolYearId = $this->route('school_year') instanceof SchoolYear
            ? $this->route('school_year')->id
            : $this->route('school_year') ?? $this->route('id'); // Resolve model ID from route

        return [
            // Name must remain unique except for the current record
            'name' => [
                'required',
                'string',
                'max:20',
                Rule::unique('school_years', 'name')->ignore($schoolYearId), // Ignore current record
            ],
            'start_date' => ['required', 'date'], // School year start date
            'end_date' => ['required', 'date', 'after:start_date'], // Must occur after start_date
            'is_active' => ['sometimes', 'boolean'], // Active year flag
        ];
    }
}
