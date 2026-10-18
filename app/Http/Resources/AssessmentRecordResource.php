<?php

// Declare strict PHP syntax for JSON API resource transformation

namespace App\Http\Resources;

// Import incoming HTTP request contract
use Illuminate\Http\Request;
// Import base Laravel JSON resource class for data serialization
use Illuminate\Http\Resources\Json\JsonResource;

// AssessmentRecordResource transforms Eloquent assessment models into standard JSON payload structures
class AssessmentRecordResource extends JsonResource
{
    // Transform the resource instance into an associative array for JSON response
    public function toArray(Request $request): array
    {
        // Return structured key-value payload with explicit type casting and loaded relation inclusion
        return [
            // Unique database primary key identifier of the assessment record
            'id' => $this->id,
            // Foreign key identifying the academic school year
            'school_year_id' => $this->school_year_id,
            // Foreign key identifying the academic term
            'term_id' => $this->term_id,
            // Foreign key identifying the junior high grade level (7, 8, 9, or 10)
            'grade_level_id' => $this->grade_level_id,
            // Foreign key identifying the classroom section
            'section_id' => $this->section_id,
            // Foreign key identifying the academic subject
            'subject_id' => $this->subject_id,
            // Foreign key identifying the teacher who conducted the assessment
            'teacher_id' => $this->teacher_id,
            // Examination milestone type (e.g., 'diagnostic', 'term_exam')
            'type' => $this->type,
            // Maximum test items casting to integer to prevent string transmission
            'total_items' => (int) $this->total_items,
            // Student raw score list stored and serialized as a JSON numeric array
            'raw_scores' => $this->raw_scores,
            // Count of participating students casting to integer
            'no_of_entries' => (int) $this->no_of_entries,
            // Calculated sample arithmetic mean casting to float
            'mean' => (float) $this->mean,
            // Calculated Mean Percentage Score percentage casting to float
            'mps' => (float) $this->mps,
            // Calculated population standard deviation casting to float
            'sd' => (float) $this->sd,
            // Peak student score achieved casting to float
            'highest_score' => (float) $this->highest_score,
            // Lowest student score recorded casting to float
            'lowest_score' => (float) $this->lowest_score,
            // Curriculum competency item identified as least mastered by students
            'least_learned_competency' => $this->least_learned_competency,
            // DepEd standardized qualitative performance remark (e.g., 'Moving Towards Mastery')
            'remarks' => $this->remarks,
            // Conditionally include teacher relation data if eagerly loaded by controller query
            'teacher' => $this->whenLoaded('teacher'),
            // Conditionally include section relation data if eagerly loaded
            'section' => $this->whenLoaded('section'),
            // Conditionally include subject relation data if eagerly loaded
            'subject' => $this->whenLoaded('subject'),
            // Conditionally include grade level relation data if eagerly loaded
            'grade_level' => $this->whenLoaded('gradeLevel'),
            // Conditionally include term relation data if eagerly loaded
            'term' => $this->whenLoaded('term'),
            // Format record creation timestamp to standard ISO datetime string
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
