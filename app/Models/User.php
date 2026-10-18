<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// Eloquent Authenticatable Model representing system users (administrators and teachers)
class User extends Authenticatable
{
    // Traits: Sanctum token issuance, factory generation, notification delivery, and soft deletes
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    // Mass-assignable attributes permitted for create and update operations
    protected $fillable = [
        // Full legal name of user
        'name',
        // Official institutional email address
        'email',
        // Encrypted password hash
        'password',
        // Active status flag: true for operational accounts, false for deactivated/pending accounts
        'is_active',
        // Account approval lifecycle state: pending, approved, or rejected
        'approval_status',
        // Timestamp when administrator approved the account
        'approved_at',
    ];

    // Hidden attributes excluded from serialized array and JSON representations
    protected $hidden = [
        // Hide password hash from API payloads
        'password',
        // Hide remember me authentication token
        'remember_token',
    ];

    // Attribute type casting for date/time formatting, boolean flags, and password hashing
    protected function casts(): array
    {
        return [
            // Cast email verification timestamp to Carbon datetime
            'email_verified_at' => 'datetime',
            // Automatically hash password attribute upon assignment
            'password' => 'hashed',
            // Cast is_active integer flag to boolean
            'is_active' => 'boolean',
            // Cast approval timestamp to Carbon datetime
            'approved_at' => 'datetime',
        ];
    }

    // Relationship: Assigned roles connecting user to roles table through role_user pivot
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    // Relationship: Active and historical teaching assignments allocated to this faculty member
    public function teachingAssignments(): HasMany
    {
        return $this->hasMany(TeachingAssignment::class);
    }

    // Check whether the user is assigned a specific role by name
    public function hasRole(string $roleName): bool
    {
        // Inspect loaded roles collection to verify presence of role name
        return $this->roles->contains('name', $roleName);
    }

    // Eloquent local query scope to filter accounts with approved status
    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    // Eloquent local query scope to filter accounts awaiting administrator approval
    public function scopePendingApproval($query)
    {
        return $query->where('approval_status', 'pending');
    }

    // Quick boolean helper to check if this user account has been approved
    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }
}
