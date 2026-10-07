<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $roles = [
            ['name' => 'system_admin', 'display_name' => 'System Administrator', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'teacher',      'display_name' => 'Teacher',              'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(['name' => $role['name']], $role);
        }
    }
}
