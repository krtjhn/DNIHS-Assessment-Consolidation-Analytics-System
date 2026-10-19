<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// Model for academic school years (e.g. S.Y. 2025-2026)
class SchoolYear extends Model
{
    use SoftDeletes; // Soft deletes preserve historical school year data

    protected $fillable = [
        'name', // School year label (e.g. 2025-2026)
        'start_date', // Academic year start date
        'end_date', // Academic year end date
        'is_active', // Whether this school year is currently open
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean', // Cast active flag as boolean
            'start_date' => 'date', // Cast start date as Carbon date
            'end_date' => 'date', // Cast end date as Carbon date
        ];
    }

    // Terms (1st, 2nd, 3rd) in this school year
    public function terms(): HasMany
    {
        return $this->hasMany(Term::class)->orderBy('term_number', 'asc'); // Ordered list of academic terms
    }

    // Sections belonging to this school year
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class); // Class sections under this school year
    }

    // Assessment records recorded during this school year
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class); // Historical assessment records
    }

    // Query scope to get only the currently active school year
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true); // Scope query to active = true
    }
}
