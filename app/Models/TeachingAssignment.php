<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model representing a teacher assigned to teach a section and subject
class TeachingAssignment extends Model
{
    protected $fillable = [
        'user_id', // Foreign key to users table for assigned teacher
        'school_year_id', // Foreign key to school_years table
        'section_id', // Foreign key to sections table
        'subject_id', // Foreign key to subjects table
        'effective_from', // Start date of assignment
        'effective_until', // End date of assignment (null if currently active)
        'assigned_by', // Foreign key to users table for admin who created assignment
    ];

    // The assigned teacher
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id'); // Link to user model
    }

    // The class section
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class); // Link to section model
    }

    // The assigned subject
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class); // Link to subject model
    }

    // The school year
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class); // Link to school year model
    }

    // Scope to get only active assignments (effective_until is null)
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('effective_until'); // Active load scope
    }

    // Scope to filter assignments for a specific teacher
    public function scopeForTeacher(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId); // Filter by teacher id
    }

    // Scope to filter assignments for a specific school year
    public function scopeForSchoolYear(Builder $query, int $schoolYearId): Builder
    {
        return $query->where('school_year_id', $schoolYearId); // Filter by school year id
    }
}
