<?php

// Declare strict PHP syntax for JSON API resource transformation

namespace App\Http\Resources;

// Import incoming HTTP request contract
use Illuminate\Http\Request;
// Import base Laravel JSON resource class for data serialization
use Illuminate\Http\Resources\Json\JsonResource;

// TeachingAssignmentResource transforms teaching assignment records with nested teacher, section, and subject data
class TeachingAssignmentResource extends JsonResource
{
    // Transform the resource model into an associative array for JSON transmission
    public function toArray(Request $request): array
    {
        // Return structured payload including nested relationships when eagerly loaded
        return [
            // Unique database primary key identifier of the teaching assignment
            'id' => $this->id,
            // Foreign key identifying the assigned teacher user ID
            'user_id' => $this->user_id,
            // Foreign key identifying the active school year
            'school_year_id' => $this->school_year_id,
            // Foreign key identifying the assigned classroom section
            'section_id' => $this->section_id,
            // Foreign key identifying the assigned subject
            'subject_id' => $this->subject_id,
            // Date string when teaching assignment takes effect
            'effective_from' => $this->effective_from,
            // Date string when teaching assignment concludes (null if currently active)
            'effective_until' => $this->effective_until,
            // Foreign key of the administrator who created the assignment
            'assigned_by' => $this->assigned_by,
            // Conditionally include teacher user profile if eagerly loaded
            'teacher' => $this->whenLoaded('teacher', fn () => [
                // Teacher user primary ID
                'id' => $this->teacher->id,
                // Teacher full name
                'name' => $this->teacher->name,
                // Teacher institutional email address
                'email' => $this->teacher->email,
            ]),
            // Conditionally include classroom section details if eagerly loaded
            'section' => $this->whenLoaded('section', fn () => [
                // Section primary ID
                'id' => $this->section->id,
                // Section name label (e.g., 'Mabini')
                'name' => $this->section->name,
                // Grade level foreign key ID
                'grade_level_id' => $this->section->grade_level_id,
                // Nested grade level details when relation is loaded on the section
                'grade_level' => $this->section->relationLoaded('gradeLevel') && $this->section->gradeLevel ? [
                    // Grade level ID
                    'id' => $this->section->gradeLevel->id,
                    // Numeric grade level integer (7, 8, 9, or 10)
                    'level' => $this->section->gradeLevel->level,
                    // Formatted grade name (e.g., 'Grade 7')
                    'display_name' => $this->section->gradeLevel->display_name,
                    // Internal name string
                    'name' => $this->section->gradeLevel->name,
                ] : null,
            ]),
            // Conditionally include academic subject details if eagerly loaded
            'subject' => $this->whenLoaded('subject', fn () => [
                // Subject primary ID
                'id' => $this->subject->id,
                // Subject course title (e.g., 'Mathematics 7')
                'name' => $this->subject->name,
                // Subject grade level foreign key ID
                'grade_level_id' => $this->subject->grade_level_id,
            ]),
            // Conditionally include academic school year information if eagerly loaded
            'school_year' => $this->whenLoaded('schoolYear', fn () => [
                // School year primary ID
                'id' => $this->schoolYear->id,
                // School year label (e.g., '2025-2026')
                'name' => $this->schoolYear->name,
                // Active school year status boolean
                'is_active' => (bool) $this->schoolYear->is_active,
            ]),
            // Format assignment creation timestamp to ISO datetime string
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
