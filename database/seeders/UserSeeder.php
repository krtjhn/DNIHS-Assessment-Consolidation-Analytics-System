<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $adminRole = DB::table('roles')->where('name', 'system_admin')->first();
        $teacherRole = DB::table('roles')->where('name', 'teacher')->first();

        // 1. Create Default Admin
        $adminId = DB::table('users')->insertGetId([
            'name' => 'System Administrator',
            'email' => 'admin@dayapnhs.edu.ph',
            'password' => Hash::make('Admin@2024!'),
            'is_active' => true,
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

        // 2. Create Sample Teachers
        $teachers = [
            ['name' => 'Maria Santos',   'email' => 'maria.santos@dayapnhs.edu.ph'],
            ['name' => 'Juan Dela Cruz', 'email' => 'juan.delacruz@dayapnhs.edu.ph'],
        ];

        foreach ($teachers as $t) {
            $teacherId = DB::table('users')->insertGetId([
                'name' => $t['name'],
                'email' => $t['email'],
                'password' => Hash::make('Teacher@2024!'),
                'is_active' => true,
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