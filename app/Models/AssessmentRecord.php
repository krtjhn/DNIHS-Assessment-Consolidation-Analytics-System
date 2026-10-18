<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

// Eloquent Model representing a completed examination score sheet and computed DepEd statistics
class AssessmentRecord extends Model
{
    use SoftDeletes;
    // Mass-assignable attributes permitted for create and update operations
    protected $fillable = [
        // Foreign key to school_years table
        'school_year_id',
        // Foreign key to terms table
        'term_id',
        // Foreign key to grade_levels table
        'grade_level_id',
        // Foreign key to sections table
        'section_id',
        // Foreign key to subjects table
        'subject_id',
        // Foreign key to users table (faculty member who recorded the scores)
        'teacher_id',
        // Assessment type: diagnostic or term_exam
        'type',
        // Total possible examination score items
        'total_items',
        // Array of raw scores stored as JSON
        'raw_scores',
        // Count of student examinees
        'no_of_entries',
        // Computed arithmetic mean score
        'mean',
        // Computed Mean Percentage Score (MPS)
        'mps',
        // Computed population standard deviation
        'sd',
        // Highest attained score
        'highest_score',
        // Lowest attained score
        'lowest_score',
        // Academic competency identified for student remediation
        'least_learned_competency',
        // Teacher assessment remarks
        'remarks',
    ];

    // Attribute type casting: auto-deserialize JSON and format decimal stats to native PHP floats
    protected function casts(): array
    {
        return [
            // Cast raw_scores JSON column to native PHP array
            'raw_scores' => 'array',
            // Cast decimal mean to float
            'mean' => 'float',
            // Cast decimal MPS to float
            'mps' => 'float',
            // Cast decimal standard deviation to float
            'sd' => 'float',
            // Cast highest score to float
            'highest_score' => 'float',
            // Cast lowest score to float
            'lowest_score' => 'float',
            // Cast total items count to integer
            'total_items' => 'integer',
            // Cast student entries count to integer
            'no_of_entries' => 'integer',
        ];
    }

    // Relationship: The faculty member who encoded this assessment record
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    // Relationship: The class section that completed this assessment
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    // Relationship: The curriculum subject assessed
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    // Relationship: The grade level corresponding to this assessment
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    // Relationship: The academic term when this test was administered
    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    // Relationship: The academic school year of this assessment
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }
}
