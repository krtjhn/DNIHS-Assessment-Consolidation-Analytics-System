<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeachingAssignmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'school_year_id' => $this->school_year_id,
            'section_id' => $this->section_id,
            'subject_id' => $this->subject_id,
            'effective_from' => $this->effective_from,
            'effective_until' => $this->effective_until,
            'assigned_by' => $this->assigned_by,
            'teacher' => $this->whenLoaded('teacher', fn () => [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
                'email' => $this->teacher->email,
            ]),
            'section' => $this->whenLoaded('section', fn () => [
                'id' => $this->section->id,
                'name' => $this->section->name,
                'grade_level_id' => $this->section->grade_level_id,
                'grade_level' => $this->section->relationLoaded('gradeLevel') && $this->section->gradeLevel ? [
                    'id' => $this->section->gradeLevel->id,
                    'level' => $this->section->gradeLevel->level,
                    'display_name' => $this->section->gradeLevel->display_name,
                    'name' => $this->section->gradeLevel->name,
                ] : null,
            ]),
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject->id,
                'name' => $this->subject->name,
                'grade_level_id' => $this->subject->grade_level_id,
            ]),
            'school_year' => $this->whenLoaded('schoolYear', fn () => [
                'id' => $this->schoolYear->id,
                'name' => $this->schoolYear->name,
                'is_active' => (bool) $this->schoolYear->is_active,
            ]),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
