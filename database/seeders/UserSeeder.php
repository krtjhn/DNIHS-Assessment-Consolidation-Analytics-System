<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Seeder for creating the default system administrator user account
class UserSeeder extends Seeder
{
    // Create the default administrator account if it does not exist
    public function run(): void
    {
        $now = now();
        $adminRole = DB::table('roles')->where('name', 'system_admin')->first(); // Fetch system admin role record

        // Check if admin account already exists
        $admin = DB::table('users')->where('email', 'admin@gmail.com')->first(); // Look up user by admin email
        if (! $admin) {
            // Check for legacy email and update it if found
            $legacyAdmin = DB::table('users')->where('email', 'admin@dayapnhs.edu.ph')->first(); // Look up legacy institutional email
            if ($legacyAdmin) {
                DB::table('users')->where('id', $legacyAdmin->id)->update([
                    'email' => 'admin@gmail.com', // Migrate legacy email to standard email
                    'email_verified_at' => $now, // Mark email as verified
                    'updated_at' => $now, // Update timestamp
                ]);
            } else {
                // Insert new admin user record
                $adminId = DB::table('users')->insertGetId([
                    'name' => 'System Administrator', // Administrator full name
                    'email' => 'admin@gmail.com', // Administrator email
                    'email_verified_at' => $now, // Mark email as verified
                    'password' => Hash::make('Admin@2024!'), // Securely hash default admin password
                    'is_active' => true, // Enable account immediately
                    'approval_status' => 'approved', // Pre-approve default administrator account
                    'approved_at' => $now, // Set approval date
                    'created_at' => $now, // Record creation timestamp
                    'updated_at' => $now, // Record update timestamp
                ]);

                // Attach the system_admin role to the user
                if ($adminRole) {
                    DB::table('role_user')->insert([
                        'user_id' => $adminId, // Link created admin user
                        'role_id' => $adminRole->id, // Link system_admin role id
                        'created_at' => $now, // Pivot table creation timestamp
                        'updated_at' => $now, // Pivot table update timestamp
                    ]);
                }
            }
        }
    }
}
