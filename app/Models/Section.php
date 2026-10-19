<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// Model for class sections (e.g. Bonifacio, Rizal)
class Section extends Model
{
    use SoftDeletes; // Soft deletes prevent data loss if a section has past scores

    protected $fillable = [
        'school_year_id', // Foreign key to school_years table
        'grade_level_id', // Foreign key to grade_levels table
        'name', // Section name label
        'is_active', // Whether the section is active
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean', // Cast active flag as boolean
        ];
    }

    // School year this section belongs to
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class); // Parent school year relation
    }

    // Grade level of this section
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class); // Parent grade level relation
    }

    // Assessment records recorded for this section
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class); // Assessments linked to this section
    }

    // Teachers assigned to this section
    public function teachingAssignments(): HasMany
    {
        return $this->hasMany(TeachingAssignment::class); // Teaching assignment loads
    }

    // Query scope to get only active sections
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true); // Filter sections where is_active is true
    }
}
