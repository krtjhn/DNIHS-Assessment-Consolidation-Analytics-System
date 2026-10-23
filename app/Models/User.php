<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// Model for system users (teachers and administrators)
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes; // Traits for API tokens, factories, notifications, soft deletes

    protected $fillable = [
        'name', // Full name of user
        'email', // Institutional or login email address
        'password', // Hashed password string
        'is_active', // Whether account is active (not deactivated)
        'approval_status', // Account status: pending, approved, or rejected
        'approved_at', // Date and time when admin approved account
    ];

    // Hide sensitive fields from JSON responses
    protected $hidden = [
        'password', // Exclude password from serialized JSON
        'remember_token', // Exclude remember token from serialized JSON
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed', // Automatically hash plain passwords on assignment
            'is_active' => 'boolean', // Cast active flag as boolean
            'approved_at' => 'datetime', // Cast approval timestamp as Carbon datetime
        ];
    }

    // Roles assigned to this user
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withPivot('created_at'); // Relational link with assignment timestamp
    }

    // Teaching assignments for this teacher
    public function teachingAssignments(): HasMany
    {
        return $this->hasMany(TeachingAssignment::class); // Workload assignments for this teacher
    }

    // Assessment records encoded by this teacher
    public function assessmentRecords(): HasMany
    {
        return $this->hasMany(AssessmentRecord::class, 'teacher_id'); // Assessments submitted by this teacher
    }

    // Check if the user has a specific role (e.g. 'teacher' or 'system_admin')
    public function hasRole(string $roleName): bool
    {
        return $this->roles->contains('name', $roleName); // Check if loaded roles include role name
    }
}
