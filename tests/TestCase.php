<?php

namespace Tests;

use App\Models\GradeLevel;
use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use DatabaseTransactions;

    private static ?string $cachedTeacherPassword = null;

    // Ensure test environment and actors exist in transaction before each test executes
    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureTestActorsExist();
    }

    // Provision isolated test actors and test sections inside the active transaction
    protected function ensureTestActorsExist(): void
    {
        if (self::$cachedTeacherPassword === null) {
            self::$cachedTeacherPassword = bcrypt('Teacher@2024!');
        }

        $teacherRole = Role::where('name', 'teacher')->first();

        // 1. Ensure Maria Santos exists for testing
        $maria = User::firstOrCreate(
            ['email' => 'maria.santos@gmail.com'],
            [
                'name' => 'Maria Santos',
                'password' => self::$cachedTeacherPassword,
                'is_active' => true,
                'approval_status' => 'approved',
            ]
        );
        if ($teacherRole && ! $maria->roles()->where('name', 'teacher')->exists()) {
            $maria->roles()->attach($teacherRole->id);
        }

        // 2. Ensure Juan Dela Cruz exists for testing
        $juan = User::firstOrCreate(
            ['email' => 'juan.delacruz@gmail.com'],
            [
                'name' => 'Juan Dela Cruz',
                'password' => self::$cachedTeacherPassword,
                'is_active' => true,
                'approval_status' => 'approved',
            ]
        );
        if ($teacherRole && ! $juan->roles()->where('name', 'teacher')->exists()) {
            $juan->roles()->attach($teacherRole->id);
        }

        // 3. Ensure test sections exist for testing
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $grade = GradeLevel::first();
        if ($sy && $grade) {
            Section::firstOrCreate(
                ['school_year_id' => $sy->id, 'grade_level_id' => $grade->id, 'name' => 'Pilot A'],
                ['is_active' => true]
            );
            Section::firstOrCreate(
                ['school_year_id' => $sy->id, 'grade_level_id' => $grade->id, 'name' => 'Pilot B'],
                ['is_active' => true]
            );
        }
    }
}
