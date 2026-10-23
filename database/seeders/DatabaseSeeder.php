<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

// Master database seeder for clean migrate:fresh --seed execution
class DatabaseSeeder extends Seeder
{
    // Seed the application's core reference data idempotently using Eloquent models
    public function run(): void
    {
        // 1. Ensure system roles exist (system_admin and teacher)
        $adminRole = Role::firstOrCreate(
            ['name' => 'system_admin'],
            ['display_name' => 'System Administrator']
        );

        Role::firstOrCreate(
            ['name' => 'teacher'],
            ['display_name' => 'Teacher']
        );

        // 2. Ensure default system administrator account exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('Admin@2024!'),
                'is_active' => true,
                'approval_status' => 'approved',
                'approved_at' => now(),
            ]
        );

        // Attach system_admin role without creating duplicate pivot rows
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);

        // 3. Ensure Junior High School grade levels (Grades 7 to 10) exist
        $gradeLevels = [];
        for ($level = 7; $level <= 10; $level++) {
            $gradeLevels[$level] = GradeLevel::firstOrCreate(
                ['level' => $level],
                ['display_name' => "Grade {$level}"]
            );
        }

        // 4. Ensure active School Year 2025-2026 and its 3 terms exist
        $schoolYear = SchoolYear::firstOrCreate(
            ['name' => '2025-2026'],
            [
                'start_date' => '2025-06-16',
                'end_date' => '2026-03-31',
                'is_active' => true,
            ]
        );

        $termDefinitions = [
            1 => ['name' => '1st Term', 'status' => 'active'],
            2 => ['name' => '2nd Term', 'status' => 'pending'],
            3 => ['name' => '3rd Term', 'status' => 'pending'],
        ];

        foreach ($termDefinitions as $termNumber => $meta) {
            Term::firstOrCreate(
                [
                    'school_year_id' => $schoolYear->id,
                    'term_number' => $termNumber,
                ],
                [
                    'name' => $meta['name'],
                    'status' => $meta['status'],
                ]
            );
        }

        // 5. Ensure all 32 standard DepEd Junior High School subjects exist (8 per grade level)
        $subjectDefinitions = [
            ['name' => 'Filipino', 'prefix' => 'FIL'],
            ['name' => 'English', 'prefix' => 'ENG'],
            ['name' => 'Mathematics', 'prefix' => 'MATH'],
            ['name' => 'Science', 'prefix' => 'SCI'],
            ['name' => 'Araling Panlipunan', 'prefix' => 'AP'],
            ['name' => 'TLE', 'prefix' => 'TLE'],
            ['name' => 'MAPEH', 'prefix' => 'MAPEH'],
            ['name' => 'Values Education', 'prefix' => 'ESP'],
        ];

        foreach ($gradeLevels as $level => $gradeModel) {
            foreach ($subjectDefinitions as $subjectDef) {
                Subject::updateOrCreate(
                    [
                        'grade_level_id' => $gradeModel->id,
                        'name' => $subjectDef['name'],
                    ],
                    [
                        'code' => "{$subjectDef['prefix']}-{$level}",
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
