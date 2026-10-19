<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Model for academic grade levels (Grade 7 through 10)
class GradeLevel extends Model
{
    protected $fillable = [
        'level', // Numeric grade level (7, 8, 9, 10)
        'display_name', // Formatted display label (e.g. Grade 7)
    ];

    // Append computed 'name' attribute to JSON output
    protected $appends = ['name']; // Expose name attribute automatically

    // Return the display name or default to 'Grade X'
    public function getNameAttribute(): string
    {
        return $this->display_name ?? "Grade {$this->level}"; // Fallback to Grade + level
    }

    // Class sections belonging to this grade level
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class); // Has many section records
    }

    // Subjects taught at this grade level
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class); // Has many subject records
    }

    // Assessment records recorded for this grade level
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class); // Has many assessment records
    }
}
