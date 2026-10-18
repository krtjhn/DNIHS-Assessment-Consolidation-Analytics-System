<?php

// Declare strict PHP syntax for JSON API resource transformation

namespace App\Http\Resources;

// Import incoming HTTP request contract
use Illuminate\Http\Request;
// Import base Laravel JSON resource class for data serialization
use Illuminate\Http\Resources\Json\JsonResource;

// SectionResource transforms Eloquent section models into standardized JSON payload structures
class SectionResource extends JsonResource
{
    // Transform the resource instance into an array representation for API responses
    public function toArray(Request $request): array
    {
        // Return structured key-value payload with explicit boolean casting and conditional relationships
        return [
            // Unique database primary key identifier of the classroom section
            'id' => $this->id,
            // Foreign key identifying the academic school year
            'school_year_id' => $this->school_year_id,
            // Foreign key identifying the junior high grade level (7, 8, 9, or 10)
            'grade_level_id' => $this->grade_level_id,
            // Section name label (e.g., 'Mabini', 'Rizal', 'Emerald')
            'name' => $this->name,
            // Active status flag cast explicitly to boolean
            'is_active' => (bool) $this->is_active,
            // Conditionally include grade level relationship if eagerly loaded
            'grade_level' => $this->whenLoaded('gradeLevel'),
            // Conditionally include school year relationship if eagerly loaded
            'school_year' => $this->whenLoaded('schoolYear'),
            // Format section creation timestamp to standard ISO datetime string
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
