<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Run the migrations to provision permanent system master data directly through migrations
    public function up(): void
    {
        $now = now();

        // 1. Drop foreign key constraint on assessment_audit_logs to allow permanent retention of deleted records
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE assessment_audit_logs DROP CONSTRAINT IF EXISTS assessment_audit_logs_assessment_id_foreign;');
        }

        // 2. Ensure System Roles exist
        $roles = [
            ['name' => 'system_admin', 'display_name' => 'System Administrator'],
            ['name' => 'teacher',      'display_name' => 'Teacher'],
        ];

        foreach ($roles as $role) {
            $exists = DB::table('roles')->where('name', $role['name'])->first();
            if (! $exists) {
                DB::table('roles')->insert([
                    'name' => $role['name'],
                    'display_name' => $role['display_name'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 3. Ensure Default System Administrator exists
        $adminRole = DB::table('roles')->where('name', 'system_admin')->first();
        $admin = DB::table('users')->where('email', 'admin@gmail.com')->first();

        if (! $admin) {
            $adminData = [
                'name' => 'System Administrator',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('Admin@2024!'),
                'is_active' => true,
                'approval_status' => 'approved',
                'approved_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (Schema::hasColumn('users', 'email_verified_at')) {
                $adminData['email_verified_at'] = $now;
            }

            $adminId = DB::table('users')->insertGetId($adminData);

            if ($adminRole) {
                $roleUserData = [
                    'user_id' => $adminId,
                    'role_id' => $adminRole->id,
                    'created_at' => $now,
                ];

                if (Schema::hasColumn('role_user', 'updated_at')) {
                    $roleUserData['updated_at'] = $now;
                }

                DB::table('role_user')->insert($roleUserData);
            }
        }

        // 4. Ensure Grade Levels 7 through 10 exist
        $gradeIds = [];
        for ($level = 7; $level <= 10; $level++) {
            $grade = DB::table('grade_levels')->where('level', $level)->first();
            if (! $grade) {
                $gradeIds[$level] = DB::table('grade_levels')->insertGetId([
                    'level' => $level,
                    'display_name' => "Grade {$level}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            } else {
                $gradeIds[$level] = $grade->id;
            }
        }

        // 5. Ensure Active School Year 2025-2026 exists
        $sy = DB::table('school_years')->where('name', '2025-2026')->first();
        if (! $sy) {
            $syId = DB::table('school_years')->insertGetId([
                'name' => '2025-2026',
                'start_date' => '2025-06-16',
                'end_date' => '2026-03-31',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Ensure 3 Academic Terms exist for the school year
            $termNames = [1 => '1st Term', 2 => '2nd Term', 3 => '3rd Term'];
            foreach ($termNames as $num => $name) {
                DB::table('terms')->insert([
                    'school_year_id' => $syId,
                    'term_number' => $num,
                    'name' => $name,
                    'status' => $num === 1 ? 'active' : 'pending',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        } else {
            $syId = $sy->id;
        }

        // 6. Ensure Standard DepEd Curriculum Subjects exist
        $subjectDefs = [
            ['name' => 'Filipino', 'prefix' => 'FIL'],
            ['name' => 'English', 'prefix' => 'ENG'],
            ['name' => 'Mathematics', 'prefix' => 'MATH'],
            ['name' => 'Science', 'prefix' => 'SCI'],
            ['name' => 'Araling Panlipunan', 'prefix' => 'AP'],
            ['name' => 'TLE', 'prefix' => 'TLE'],
            ['name' => 'MAPEH', 'prefix' => 'MAPEH'],
            ['name' => 'Values Education', 'prefix' => 'ESP'],
        ];

        foreach ($gradeIds as $level => $gId) {
            foreach ($subjectDefs as $def) {
                $code = "{$def['prefix']}-{$level}";
                $sName = $def['name'];

                $exists = DB::table('subjects')
                    ->where('grade_level_id', $gId)
                    ->where('name', $sName)
                    ->first();

                if (! $exists) {
                    DB::table('subjects')->insert([
                        'name' => $sName,
                        'code' => $code,
                        'grade_level_id' => $gId,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                } else {
                    DB::table('subjects')->where('id', $exists->id)->update([
                        'code' => $code,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    // Reverse the migrations
    public function down(): void
    {
        // Master reference data is preserved to maintain database integrity
    }
};
