<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

// Master database seeder that runs all initial application seeders
class DatabaseSeeder extends Seeder
{
    // Execute the seeders in the required order
    public function run(): void
    {
        $this->call([
            RoleSeeder::class, // Seed default user roles (system_admin and teacher)
            UserSeeder::class, // Seed the initial default system administrator account
            AcademicSeeder::class, // Seed academic metadata (grades, school year, terms, subjects)
        ]);
    }
}
