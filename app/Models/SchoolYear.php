<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolYear extends Model
{
    protected $fillable = ['name', 'start_date', 'end_date', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function terms(): HasMany
    {
        return $this->hasMany(Term::class)->orderBy('term_number', 'asc');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
