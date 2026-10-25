<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Transform an assessment record model into a clean JSON response
class AssessmentRecordResource extends JsonResource
{
    // Convert the assessment record into an array
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, // Primary key of the assessment record
            'school_year_id' => $this->school_year_id, // Associated school year id
            'term_id' => $this->term_id, // Academic term id (e.g. 1st, 2nd, or 3rd term)
            'grade_level_id' => $this->grade_level_id, // Grade level id (Grade 7 to 10)
            'section_id' => $this->section_id, // Section id
            'subject_id' => $this->subject_id, // Subject id
            'teacher_id' => $this->teacher_id, // Id of the teacher who encoded this record
            'type' => $this->type, // Assessment type: diagnostic or term_exam
            'total_items' => (int) $this->total_items, // Total exam items cast as integer
            'raw_scores' => $this->raw_scores, // Array of student exam scores
            'no_of_entries' => (int) $this->no_of_entries, // Count of students who took the exam
            'mean' => (float) $this->mean, // Calculated arithmetic average score
            'mps' => (float) $this->mps, // Mean Percentage Score percentage
            'sd' => (float) $this->sd, // Population standard deviation
            'highest_score' => (float) $this->highest_score, // Highest score achieved in class
            'lowest_score' => (float) $this->lowest_score, // Lowest score recorded in class
            'least_learned_competency' => $this->least_learned_competency, // Competency item needing review
            'remarks' => $this->remarks, // Qualitative completion or mastery remarks
            'teacher' => $this->whenLoaded('teacher'), // Teacher relation when loaded
            'section' => $this->whenLoaded('section'), // Section relation when loaded
            'subject' => $this->whenLoaded('subject'), // Subject relation when loaded
            'grade_level' => $this->whenLoaded('gradeLevel'), // Grade level relation when loaded
            'term' => $this->whenLoaded('term'), // Term relation when loaded
            'school_year' => $this->whenLoaded('schoolYear'), // School year relation when loaded
            'created_at' => $this->created_at?->toDateTimeString(), // Record creation timestamp
            'updated_at' => $this->updated_at?->toDateTimeString(), // Record last updated timestamp
        ];
    }
}
