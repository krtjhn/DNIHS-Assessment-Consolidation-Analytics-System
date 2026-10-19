<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Transform a teaching assignment model into a JSON response with related details
class TeachingAssignmentResource extends JsonResource
{
    // Convert the teaching assignment into an array
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, // Primary key of the teaching assignment
            'user_id' => $this->user_id, // Assigned teacher user id
            'school_year_id' => $this->school_year_id, // Target school year id
            'section_id' => $this->section_id, // Assigned section id
            'subject_id' => $this->subject_id, // Assigned subject id
            'effective_from' => $this->effective_from, // Start date of assignment
            'effective_until' => $this->effective_until, // End date of assignment (null if ongoing)
            'assigned_by' => $this->assigned_by, // Admin user id who created assignment
            // Include teacher profile details if loaded
            'teacher' => $this->whenLoaded('teacher', fn () => [
                'id' => $this->teacher->id, // Teacher user id
                'name' => $this->teacher->name, // Teacher full name
                'email' => $this->teacher->email, // Teacher email address
            ]),
            // Include section and its grade level details if loaded
            'section' => $this->whenLoaded('section', fn () => [
                'id' => $this->section->id, // Section id
                'name' => $this->section->name, // Section name
                'grade_level_id' => $this->section->grade_level_id, // Grade level id
                'grade_level' => $this->section->relationLoaded('gradeLevel') && $this->section->gradeLevel ? [
                    'id' => $this->section->gradeLevel->id, // Grade level id
                    'level' => $this->section->gradeLevel->level, // Grade number (7, 8, 9, 10)
                    'display_name' => $this->section->gradeLevel->display_name, // Formatted grade name
                    'name' => $this->section->gradeLevel->name, // Internal grade name
                ] : null,
            ]),
            // Include subject details if loaded
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject->id, // Subject id
                'name' => $this->subject->name, // Subject name
                'grade_level_id' => $this->subject->grade_level_id, // Subject grade level id
            ]),
            // Include school year details if loaded
            'school_year' => $this->whenLoaded('schoolYear', fn () => [
                'id' => $this->schoolYear->id, // School year id
                'name' => $this->schoolYear->name, // School year name
                'is_active' => (bool) $this->schoolYear->is_active, // Active school year flag
            ]),
            'created_at' => $this->created_at?->toDateTimeString(), // Record creation timestamp
        ];
    }
}
