<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Eloquent Model representing a class section within a specific grade level and academic school year
class Section extends Model
{
    // Mass-assignable attributes permitted for section creation and updates
    protected $fillable = [
        // Foreign key linking section to academic school year
        'school_year_id',
        // Foreign key linking section to grade level (Grade 7, 8, 9, or 10)
        'grade_level_id',
        // Class section designation name (e.g. Diamond, Emerald, Mabini)
        'name',
        // Operational status flag: true for active sections, false for archived/deactivated sections
        'is_active',
    ];

    // Attribute type casting
    protected function casts(): array
    {
        return [
            // Cast is_active attribute to native boolean
            'is_active' => 'boolean',
        ];
    }

    // Relationship: The academic school year this section belongs to
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    // Relationship: The grade level corresponding to this section
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    // Relationship: All student assessment records encoded for this section
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class);
    }

    // Relationship: Teaching assignments allocated to faculty members for this section
    public function teachingAssignments(): HasMany
    {
        return $this->hasMany(TeachingAssignment::class);
    }

    // Eloquent query scope to retrieve only active sections
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
