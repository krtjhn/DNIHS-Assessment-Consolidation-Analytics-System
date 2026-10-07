<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentRecord extends Model
{
    protected $fillable = [
        'school_year_id',
        'term_id',
        'grade_level_id',
        'section_id',
        'subject_id',
        'teacher_id',
        'type',
        'total_items',
        'raw_scores',
        'no_of_entries',
        'mean',
        'mps',
        'sd',
        'highest_score',
        'lowest_score',
        'least_learned_competency',
        'remarks',
    ];

    /**
     * Automatically cast raw_scores from JSON string to PHP array!
     */
    protected function casts(): array
    {
        return [
            'raw_scores' => 'array',
            'mean' => 'float',
            'mps' => 'float',
            'sd' => 'float',
            'highest_score' => 'float',
            'lowest_score' => 'float',
            'total_items' => 'integer',
            'no_of_entries' => 'integer',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }
}