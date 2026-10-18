<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Eloquent Model representing an academic term within a school year (1st, 2nd, 3rd Term)
class Term extends Model
{
    // Mass-assignable attributes
    protected $fillable = [
        // Foreign key linking term to parent school year
        'school_year_id',
        // Sequential term number (e.g. 1 for 1st Term, 2 for 2nd Term)
        'term_number',
        // Official title of the term (e.g. 1st Term, 2nd Term, 3rd Term)
        'name',
        // Calendar status: pending (locked), active (open for encoding), or completed (locked)
        'status',
    ];

    // Relationship: The parent school year this academic term belongs to
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    // Security helper: Check whether this academic term is currently open for score encoding and modifications
    public function isOpen(): bool
    {
        // Only terms marked with active status permit score encoding
        return $this->status === 'active';
    }
}
