<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

// Model for user roles (system_admin, teacher) used in permission checks
class Role extends Model
{
    protected $fillable = [
        'name', // Internal role slug: system_admin or teacher
        'display_name', // Human-readable label: System Administrator or Teacher
    ];

    // Users who have this role
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('created_at'); // Many-to-many relationship via role_user table
    }
}
