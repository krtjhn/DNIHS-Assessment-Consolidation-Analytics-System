<?php

namespace App\Http\Requests\SchoolYears;

use App\Models\SchoolYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolYearRequest extends FormRequest
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
        $schoolYearId = $this->route('school_year') instanceof SchoolYear
            ? $this->route('school_year')->id
            : $this->route('school_year') ?? $this->route('id');

        return [
            'name' => [
                'required',
                'string',
                'max:20',
                Rule::unique('school_years', 'name')->ignore($schoolYearId),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
