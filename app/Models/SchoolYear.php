<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Eloquent Model representing an academic school year (e.g. 2025-2026)
class SchoolYear extends Model
{
    // Mass-assignable attributes
    protected $fillable = [
        // Academic year designation string (e.g. 2025-2026)
        'name',
        // Official opening date of school year
        'start_date',
        // Official concluding date of school year
        'end_date',
        // Boolean flag: true if this is the currently active school year
        'is_active',
    ];

    // Attribute type casting
    protected function casts(): array
    {
        return [
            // Cast is_active attribute to boolean
            'is_active' => 'boolean',
            // Cast start_date to Carbon date
            'start_date' => 'date',
            // Cast end_date to Carbon date
            'end_date' => 'date',
        ];
    }

    // Relationship: Academic terms (1st, 2nd, 3rd) established under this school year
    public function terms(): HasMany
    {
        return $this->hasMany(Term::class)->orderBy('term_number', 'asc');
    }

    // Relationship: Class sections registered under this school year
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    // Relationship: Student examination assessment records encoded during this school year
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class);
    }

    // Eloquent local query scope to filter the currently active school year
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
