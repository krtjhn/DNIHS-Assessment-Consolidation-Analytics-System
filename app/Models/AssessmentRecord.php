<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

// Model for student assessment score sheets and computed DepEd statistics
class AssessmentRecord extends Model
{
    use SoftDeletes; // Enable soft deletion to prevent permanent loss of score history

    // Attributes that can be filled in bulk
    protected $fillable = [
        'school_year_id', // Foreign key to school_years table
        'term_id', // Foreign key to terms table
        'grade_level_id', // Foreign key to grade_levels table
        'section_id', // Foreign key to sections table
        'subject_id', // Foreign key to subjects table
        'teacher_id', // Foreign key to users table for the teacher
        'type', // Assessment milestone: diagnostic or term_exam
        'total_items', // Maximum exam score possible
        'raw_scores', // JSON array of student scores
        'no_of_entries', // Total number of examinees
        'mean', // Arithmetic average of scores
        'mps', // Mean Percentage Score
        'sd', // Standard deviation
        'highest_score', // Highest score achieved
        'lowest_score', // Lowest score achieved
        'least_learned_competency', // Topic requiring remedial instruction
        'remarks', // Qualitative remarks: Complete or Incomplete
    ];

    // Cast attributes to native PHP types
    protected function casts(): array
    {
        return [
            'raw_scores' => 'array', // Convert JSON string to PHP array automatically
            'mean' => 'float', // Cast arithmetic average as float
            'mps' => 'float', // Cast Mean Percentage Score as float
            'sd' => 'float', // Cast standard deviation as float
            'highest_score' => 'float', // Cast high score as float
            'lowest_score' => 'float', // Cast low score as float
            'total_items' => 'integer', // Cast item count as integer
            'no_of_entries' => 'integer', // Cast student count as integer
        ];
    }

    // Teacher who encoded the score sheet
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id'); // Link to user model
    }

    // Section that took the test
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class); // Link to section model
    }

    // Subject assessed
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class); // Link to subject model
    }

    // Grade level of the assessment
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class); // Link to grade level model
    }

    // Academic term (1st, 2nd, 3rd)
    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class); // Link to term model
    }

    // School year of the assessment
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class); // Link to school year model
    }
}
