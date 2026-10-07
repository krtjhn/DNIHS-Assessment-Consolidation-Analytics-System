<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeLevel extends Model
{
    protected $fillable = ['level', 'display_name'];

    protected $appends = ['name'];

    public function getNameAttribute(): string
    {
        return $this->display_name ?? "Grade {$this->level}";
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }
}
