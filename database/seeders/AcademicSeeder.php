<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AcademicSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // 1. Seed Grade 7 to 10
        $gradeIds = [];
        for ($level = 7; $level <= 10; $level++) {
            $gradeIds[$level] = DB::table('grade_levels')->insertGetId([
                'level' => $level,
                'display_name' => "Grade {$level}",
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // 2. Seed Active School Year 2025-2026
        $syId = DB::table('school_years')->insertGetId([
            'name' => '2025-2026',
            'start_date' => '2025-06-16',
            'end_date' => '2026-03-31',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 3. Seed 3 Terms (Term 1 is Active)
        $termNames = [1 => 'First Term', 2 => 'Second Term', 3 => 'Third Term'];
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

        // 4. Seed Standard DepEd Subjects per Grade Level
        $subjectNames = [
            'Filipino', 'English', 'Mathematics', 'Science',
            'Araling Panlipunan', 'TLE', 'MAPEH', 'Values Education',
        ];

        $firstSubjectId = null;
        foreach ($gradeIds as $level => $gId) {
            foreach ($subjectNames as $sName) {
                $subId = DB::table('subjects')->insertGetId([
                    'name' => $sName,
                    'grade_level_id' => $gId,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                if ($level === 7 && $sName === 'Mathematics') {
                    $firstSubjectId = $subId;
                }
            }
        }

        // 5. Seed Sample Sections for School Year 2025-2026
        $sectionNames = [
            7 => ['Pilot', 'Pilot B'],
            8 => ['Pilot', 'Pilot B'],
            9 => ['Pilot', 'Pilot B'],
            10 => ['Pilot', 'Pilot B'],
        ];

        $firstSectionId = null;
        foreach ($sectionNames as $level => $secList) {
            foreach ($secList as $secName) {
                $secId = DB::table('sections')->insertGetId([
                    'school_year_id' => $syId,
                    'grade_level_id' => $gradeIds[$level],
                    'name' => $secName,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                if ($level === 7 && $secName === 'Pilot') {
                    $firstSectionId = $secId;
                }
            }
        }

        // 6. Seed Sample Teaching Assignment for Maria Santos (Grade 7 - Pilot : Mathematics)
        $maria = DB::table('users')->where('email', 'maria.santos@dayapnhs.edu.ph')->first();
        if ($maria && $firstSectionId && $firstSubjectId) {
            DB::table('teaching_assignments')->insert([
                'user_id' => $maria->id,
                'school_year_id' => $syId,
                'section_id' => $firstSectionId,
                'subject_id' => $firstSubjectId,
                'effective_from' => '2025-06-16',
                'effective_until' => null,
                'assigned_by' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
