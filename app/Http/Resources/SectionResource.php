<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Transform a section model into a clean JSON response
class SectionResource extends JsonResource
{
    // Convert the section into an array
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, // Primary key of the section
            'school_year_id' => $this->school_year_id, // Associated school year id
            'grade_level_id' => $this->grade_level_id, // Associated grade level id (Grade 7 to 10)
            'name' => $this->name, // Section name (e.g. Rizal, Mabini, Emerald)
            'is_active' => (bool) $this->is_active, // Whether the section is active
            'grade_level' => $this->whenLoaded('gradeLevel'), // Grade level model when loaded
            'school_year' => $this->whenLoaded('schoolYear'), // School year model when loaded
            'created_at' => $this->created_at?->toDateTimeString(), // Record creation timestamp
        ];
    }
}
