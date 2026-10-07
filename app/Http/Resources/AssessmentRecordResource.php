<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssessmentRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'school_year_id'           => $this->school_year_id,
            'term_id'                  => $this->term_id,
            'grade_level_id'           => $this->grade_level_id,
            'section_id'               => $this->section_id,
            'subject_id'               => $this->subject_id,
            'teacher_id'               => $this->teacher_id,
            'type'                     => $this->type,
            'total_items'              => (int) $this->total_items,
            'raw_scores'               => $this->raw_scores,
            'no_of_entries'            => (int) $this->no_of_entries,
            'mean'                     => (float) $this->mean,
            'mps'                      => (float) $this->mps,
            'sd'                       => (float) $this->sd,
            'highest_score'            => (float) $this->highest_score,
            'lowest_score'             => (float) $this->lowest_score,
            'least_learned_competency' => $this->least_learned_competency,
            'remarks'                  => $this->remarks,
            'teacher'                  => $this->whenLoaded('teacher'),
            'section'                  => $this->whenLoaded('section'),
            'subject'                  => $this->whenLoaded('subject'),
            'grade_level'              => $this->whenLoaded('gradeLevel'),
            'term'                     => $this->whenLoaded('term'),
            'created_at'               => $this->created_at?->toDateTimeString(),
        ];
    }
}