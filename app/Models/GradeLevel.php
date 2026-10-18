<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Eloquent Model representing academic grade levels (e.g. Grade 7, Grade 8, Grade 9, Grade 10)
class GradeLevel extends Model
{
    // Mass-assignable attributes
    protected $fillable = [
        // Numeric grade level indicator (7, 8, 9, 10)
        'level',
        // Official display name (e.g. Grade 7)
        'display_name',
    ];

    // Accessor attributes automatically appended to array/JSON serialization
    protected $appends = ['name'];

    // Accessor returning the formatted grade level name
    public function getNameAttribute(): string
    {
        return $this->display_name ?? "Grade {$this->level}";
    }

    // Relationship: Class sections organized under this grade level
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    // Relationship: DepEd curriculum subjects taught at this grade level
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }
}
