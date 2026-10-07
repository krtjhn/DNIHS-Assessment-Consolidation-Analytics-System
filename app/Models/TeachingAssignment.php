<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeachingAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'school_year_id',
        'section_id',
        'subject_id',
        'effective_from',
        'effective_until',
        'assigned_by',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('effective_until');
    }

    public function scopeForTeacher(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForSchoolYear(Builder $query, int $schoolYearId): Builder
    {
        return $query->where('school_year_id', $schoolYearId);
    }
}
