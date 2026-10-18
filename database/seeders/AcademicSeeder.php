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

        // 4. Seed Standard DepEd Subjects per Grade Level with Curriculum Codes
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
}
