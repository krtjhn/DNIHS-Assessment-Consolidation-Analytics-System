<?php

// Declare strict PHP syntax for role-based authorization model

namespace App\Models;

// Import base Eloquent model class
use Illuminate\Database\Eloquent\Model;
// Import many-to-many relationship return type definition
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

// Role model defines system access tiers (admin, teacher, school_head) for RBAC enforcement
class Role extends Model
{
    // Define fillable columns for mass assignment
    protected $fillable = [
        // Unique technical role slug (e.g., 'admin', 'teacher')
        'name',
        // Human-readable label displayed in UI (e.g., 'Administrator', 'Teacher')
        'display_name',
    ];

    // Define many-to-many relationship connecting roles to assigned user accounts
    public function users(): BelongsToMany
    {
        // Link to User model via role_user pivot table with automatic timestamp tracking
        return $this->belongsToMany(User::class)->withTimestamps();
    }
}
