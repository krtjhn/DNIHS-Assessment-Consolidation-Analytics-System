<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Seeder for creating the default system administrator and sample teacher accounts
class UserSeeder extends Seeder
{
    // Populate administrator and sample faculty accounts
    public function run(): void
    {
        $now = now();
        $adminRole = DB::table('roles')->where('name', 'system_admin')->first();
        $teacherRole = DB::table('roles')->where('name', 'teacher')->first();

        // 1. Seed or update default System Administrator
        $admin = DB::table('users')->where('email', 'admin@gmail.com')->first();
        if (! $admin) {
            $adminId = DB::table('users')->insertGetId([
                'name' => 'System Administrator',
                'email' => 'admin@gmail.com',
                'email_verified_at' => $now,
                'password' => Hash::make('Admin@2024!'),
                'is_active' => true,
                'approval_status' => 'approved',
                'approved_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($adminRole) {
                DB::table('role_user')->insert([
                    'user_id' => $adminId,
                    'role_id' => $adminRole->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 2. Seed Sample Approved Teachers (used by system and automated tests)
        $sampleTeachers = [
            [
                'name' => 'Maria Santos',
                'email' => 'maria.santos@gmail.com',
                'password' => Hash::make('Teacher@2024!'),
                'is_active' => true,
                'approval_status' => 'approved',
                'approved_at' => $now,
            ],
            [
                'name' => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@gmail.com',
                'password' => Hash::make('Teacher@2024!'),
                'is_active' => true,
                'approval_status' => 'approved',
                'approved_at' => $now,
            ],
            // Sample pending applicant teacher (for demonstrating Admin Approval feature)
            [
                'name' => 'Pedro Penduko',
                'email' => 'pedro.penduko@gmail.com',
                'password' => Hash::make('Teacher@2024!'),
                'is_active' => false,
                'approval_status' => 'pending',
                'approved_at' => null,
            ],
        ];

        foreach ($sampleTeachers as $tData) {
            $existing = DB::table('users')->where('email', $tData['email'])->first();
            if (! $existing) {
                $teacherId = DB::table('users')->insertGetId([
                    'name' => $tData['name'],
                    'email' => $tData['email'],
                    'email_verified_at' => $now,
                    'password' => $tData['password'],
                    'is_active' => $tData['is_active'],
                    'approval_status' => $tData['approval_status'],
                    'approved_at' => $tData['approved_at'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                if ($teacherRole) {
                    DB::table('role_user')->insert([
                        'user_id' => $teacherId,
                        'role_id' => $teacherRole->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }
}
