<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Model for school subjects (e.g. Mathematics, Science)
class Subject extends Model
{
    protected $fillable = [
        'grade_level_id', // Foreign key to grade_levels table
        'name', // Subject title (e.g. Mathematics 7)
        'code', // Unique curriculum subject code (e.g. MATH-7)
        'is_active', // Whether the subject is currently taught
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean', // Cast active flag as boolean
        ];
    }

    // Grade level where this subject is taught
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class); // Parent grade level relation
    }

    // Teaching assignments for this subject
    public function teachingAssignments(): HasMany
    {
        return $this->hasMany(TeachingAssignment::class); // Teachers assigned to teach this subject
    }

    // Assessment records recorded for this subject
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class); // Assessment exams recorded for this subject
    }
}
