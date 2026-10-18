<?php

// Declare strict PHP syntax for teaching assignment data model

namespace App\Models;

// Import Eloquent query builder interface for custom query scopes
use Illuminate\Database\Eloquent\Builder;
// Import base Eloquent model class providing active record functionality
use Illuminate\Database\Eloquent\Model;
// Import belongs-to relationship return type definition
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// TeachingAssignment represents the authorization link binding a teacher to a specific section and subject
class TeachingAssignment extends Model
{
    // Define the database attributes that can be mass-assigned during assignment creation
    protected $fillable = [
        // Foreign key referencing the assigned teacher in the users table
        'user_id',
        // Foreign key referencing the academic school year
        'school_year_id',
        // Foreign key referencing the specific classroom section
        'section_id',
        // Foreign key referencing the curriculum subject
        'subject_id',
        // Start date when this teaching assignment officially becomes valid
        'effective_from',
        // End date when assignment concludes (null denotes an active, ongoing assignment)
        'effective_until',
        // Foreign key referencing the administrator who authorized the assignment
        'assigned_by',
    ];

    // Define inverse relationship linking the assignment to the assigned teacher account
    public function teacher(): BelongsTo
    {
        // Link user_id foreign key on teaching_assignments table to primary id on users table
        return $this->belongsTo(User::class, 'user_id');
    }

    // Define relationship linking assignment to the classroom section
    public function section(): BelongsTo
    {
        // Link section_id foreign key to primary id on sections table
        return $this->belongsTo(Section::class);
    }

    // Define relationship linking assignment to the academic subject
    public function subject(): BelongsTo
    {
        // Link subject_id foreign key to primary id on subjects table
        return $this->belongsTo(Subject::class);
    }

    // Define relationship linking assignment to the academic school year
    public function schoolYear(): BelongsTo
    {
        // Link school_year_id foreign key to primary id on school_years table
        return $this->belongsTo(SchoolYear::class);
    }

    // Local query scope filtering for currently active teaching assignments (not revoked or ended)
    public function scopeActive(Builder $query): Builder
    {
        // Active assignments have a null effective_until date
        return $query->whereNull('effective_until');
    }

    // Local query scope filtering assignments assigned to a specific teacher account
    public function scopeForTeacher(Builder $query, int $userId): Builder
    {
        // Match user_id column against the specified teacher user ID
        return $query->where('user_id', $userId);
    }

    // Local query scope filtering assignments operating within a specific academic school year
    public function scopeForSchoolYear(Builder $query, int $schoolYearId): Builder
    {
        // Match school_year_id column against the requested school year ID
        return $query->where('school_year_id', $schoolYearId);
    }
}
