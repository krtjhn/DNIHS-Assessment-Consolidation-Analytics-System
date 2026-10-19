<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Seeder to populate the basic system roles
class RoleSeeder extends Seeder
{
    // Insert or update default system roles
    public function run(): void
    {
        $now = now();
        $roles = [
            ['name' => 'system_admin', 'display_name' => 'System Administrator', 'created_at' => $now, 'updated_at' => $now], // Admin role with full permissions
            ['name' => 'teacher',      'display_name' => 'Teacher',              'created_at' => $now, 'updated_at' => $now], // Teacher role for score entry
        ];

        // Insert or update each role by its name
        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(['name' => $role['name']], $role); // Prevent duplicate roles by matching on name
        }
    }
}
