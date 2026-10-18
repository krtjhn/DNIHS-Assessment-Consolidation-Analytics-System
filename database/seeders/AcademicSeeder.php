<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AcademicSeeder extends Seeder
{
    // Seed essential academic metadata: grade levels, active school year, terms, and standard DepEd subjects
    public function run(): void
    {
        $now = now();

        // 1. Seed Grade 7 to 10
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

        // 2. Seed Active School Year 2025-2026
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

            // 3. Seed 3 Terms (1st Term is Active)
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

        // 4. Seed Standard DepEd Subjects per Grade Level
        $subjectNames = [
            'Filipino', 'English', 'Mathematics', 'Science',
            'Araling Panlipunan', 'TLE', 'MAPEH', 'Values Education',
        ];

        foreach ($gradeIds as $level => $gId) {
            foreach ($subjectNames as $sName) {
                $exists = DB::table('subjects')
                    ->where('grade_level_id', $gId)
                    ->where('name', $sName)
                    ->exists();

                if (! $exists) {
                    DB::table('subjects')->insert([
                        'name' => $sName,
                        'grade_level_id' => $gId,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }
}
