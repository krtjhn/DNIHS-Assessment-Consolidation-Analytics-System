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

        // Create default system administrator with @gmail.com
        $admin = DB::table('users')->where('email', 'admin@gmail.com')->first();
        if (! $admin) {
            $legacyAdmin = DB::table('users')->where('email', 'admin@dayapnhs.edu.ph')->first();
            if ($legacyAdmin) {
                DB::table('users')->where('id', $legacyAdmin->id)->update([
                    'email' => 'admin@gmail.com',
                    'updated_at' => $now,
                ]);
            } else {
                $adminId = DB::table('users')->insertGetId([
                    'name' => 'System Administrator',
                    'email' => 'admin@gmail.com',
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
            }
        }
    }
}
