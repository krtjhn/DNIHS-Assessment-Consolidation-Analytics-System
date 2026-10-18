<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Eloquent Model representing a curriculum subject area (e.g. Mathematics, Science, English, Filipino)
class Subject extends Model
{
    // Mass-assignable attributes
    protected $fillable = [
        // Foreign key linking subject to corresponding grade level
        'grade_level_id',
        // Official curriculum subject name
        'name',
        // Active status flag: true if subject is currently offered
        'is_active',
    ];

    // Attribute type casting
    protected function casts(): array
    {
        return [
            // Cast is_active attribute to boolean
            'is_active' => 'boolean',
        ];
    }

    // Relationship: The grade level where this subject is offered
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }
}
