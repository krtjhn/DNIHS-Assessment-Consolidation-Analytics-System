<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Seeder to create default academic metadata: grade levels, school years, terms, and subjects
class AcademicSeeder extends Seeder
{
    // Populate default academic records
    public function run(): void
    {
        $now = now(); // Current timestamp for created_at and updated_at

        // 1. Seed Grade Levels 7 through 10
        $gradeIds = []; // Map of level number to database id
        for ($level = 7; $level <= 10; $level++) {
            $grade = DB::table('grade_levels')->where('level', $level)->first(); // Check if grade level already exists
            if (! $grade) {
                $gradeIds[$level] = DB::table('grade_levels')->insertGetId([
                    'level' => $level, // Numeric grade (7, 8, 9, 10)
                    'display_name' => "Grade {$level}", // Formatted display label
                    'created_at' => $now, // Creation timestamp
                    'updated_at' => $now, // Update timestamp
                ]);
            } else {
                $gradeIds[$level] = $grade->id; // Reuse existing grade level id
            }
        }

        // 2. Seed active school year 2025-2026
        $sy = DB::table('school_years')->where('name', '2025-2026')->first(); // Check if school year already exists
        if (! $sy) {
            $syId = DB::table('school_years')->insertGetId([
                'name' => '2025-2026', // Academic year label
                'start_date' => '2025-06-16', // School year start date
                'end_date' => '2026-03-31', // School year end date
                'is_active' => true, // Set as the currently active school year
                'created_at' => $now, // Creation timestamp
                'updated_at' => $now, // Update timestamp
            ]);

            // 3. Seed 3 academic terms (1st Term is set to active)
            $termNames = [1 => '1st Term', 2 => '2nd Term', 3 => '3rd Term']; // DepEd 3-term structure
            foreach ($termNames as $num => $name) {
                DB::table('terms')->insert([
                    'school_year_id' => $syId, // Parent school year foreign key
                    'term_number' => $num, // Term sequence number (1, 2, 3)
                    'name' => $name, // Term display label
                    'status' => $num === 1 ? 'active' : 'pending', // Activate 1st term; keep others pending
                    'created_at' => $now, // Creation timestamp
                    'updated_at' => $now, // Update timestamp
                ]);
            }
        } else {
            $syId = $sy->id; // Reuse existing school year id
        }

        // 4. Seed standard DepEd subjects for each junior high grade level
        $subjectDefs = [
            ['name' => 'Filipino', 'prefix' => 'FIL'], // Mother tongue / national language
            ['name' => 'English', 'prefix' => 'ENG'], // English language arts
            ['name' => 'Mathematics', 'prefix' => 'MATH'], // Mathematics
            ['name' => 'Science', 'prefix' => 'SCI'], // Integrated Science
            ['name' => 'Araling Panlipunan', 'prefix' => 'AP'], // Social Studies
            ['name' => 'TLE', 'prefix' => 'TLE'], // Technology and Livelihood Education
            ['name' => 'MAPEH', 'prefix' => 'MAPEH'], // Music, Arts, PE, and Health
            ['name' => 'Values Education', 'prefix' => 'ESP'], // Edukasyon sa Pagpapakatao
        ];

        foreach ($gradeIds as $level => $gId) {
            foreach ($subjectDefs as $def) {
                $code = "{$def['prefix']}-{$level}"; // Format subject code (e.g. MATH-7)
                $sName = $def['name']; // Subject title

                $exists = DB::table('subjects')
                    ->where('grade_level_id', $gId)
                    ->where('name', $sName)
                    ->first(); // Check if subject already exists for this grade level

                if (! $exists) {
                    DB::table('subjects')->insert([
                        'name' => $sName, // Subject name
                        'code' => $code, // Unique subject curriculum code
                        'grade_level_id' => $gId, // Associated grade level id
                        'is_active' => true, // Mark subject active
                        'created_at' => $now, // Creation timestamp
                        'updated_at' => $now, // Update timestamp
                    ]);
                } else {
                    DB::table('subjects')->where('id', $exists->id)->update([
                        'code' => $code, // Ensure code is synchronized
                        'updated_at' => $now, // Update timestamp
                    ]);
                }
            }
        }
    }
}
