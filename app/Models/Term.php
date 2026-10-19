<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Model for academic terms (1st Term, 2nd Term, 3rd Term)
class Term extends Model
{
    protected $fillable = [
        'school_year_id', // Foreign key to school_years table
        'term_number', // Term sequence number (1, 2, or 3)
        'name', // Term display name (e.g. 1st Term)
        'status', // Calendar state: pending, active, or completed
    ];

    // Parent school year
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class); // Parent school year relation
    }

    // Assessment records recorded during this term
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class); // Assessments recorded for this term
    }

    // Check if this term is open for score encoding
    public function isOpen(): bool
    {
        return $this->status === 'active'; // True only when term status is active
    }
}
