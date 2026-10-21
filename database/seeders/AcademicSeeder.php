<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Seeder to create default academic metadata: grade levels, school years, terms, subjects, sections, and assignments
class AcademicSeeder extends Seeder
{
    // Populate default academic records
    public function run(): void
    {
        $now = now();

        // 1. Seed Grade Levels 7 through 10
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

        // 2. Seed active school year 2025-2026
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

            // 3. Seed 3 academic terms (1st Term is active)
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

        // 4. Seed standard DepEd subjects for each junior high grade level
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

        // 5. Seed Sections for School Year 2025-2026
        $sectionsByGrade = [
            7  => ['Rizal', 'Bonifacio', 'Pilot A'],
            8  => ['Mabini', 'Del Pilar', 'Pilot B'],
            9  => ['Luna', 'Silang'],
            10 => ['Aquino', 'Quezon'],
        ];

        $firstSectionId = null;
        foreach ($sectionsByGrade as $level => $secNames) {
            foreach ($secNames as $secName) {
                $sec = DB::table('sections')->where([
                    'school_year_id' => $syId,
                    'grade_level_id' => $gradeIds[$level],
                    'name' => $secName,
                ])->first();

                if (! $sec) {
                    $sId = DB::table('sections')->insertGetId([
                        'school_year_id' => $syId,
                        'grade_level_id' => $gradeIds[$level],
                        'name' => $secName,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                } else {
                    $sId = $sec->id;
                }

                if ($level === 7 && $secName === 'Rizal') {
                    $firstSectionId = $sId;
                }
            }
        }

        // 6. Seed Sample Teaching Assignments
        $maria = DB::table('users')->where('email', 'maria.santos@gmail.com')->first();
        $math7 = DB::table('subjects')->where('grade_level_id', $gradeIds[7])->where('name', 'Mathematics')->first();

        if ($maria && $firstSectionId && $math7) {
            $assignmentExists = DB::table('teaching_assignments')->where([
                'user_id' => $maria->id,
                'school_year_id' => $syId,
                'section_id' => $firstSectionId,
                'subject_id' => $math7->id,
            ])->exists();

            if (! $assignmentExists) {
                DB::table('teaching_assignments')->insert([
                    'user_id' => $maria->id,
                    'school_year_id' => $syId,
                    'section_id' => $firstSectionId,
                    'subject_id' => $math7->id,
                    'effective_from' => '2025-06-16',
                    'effective_until' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 7. Seed Sample Diagnostic Assessment Record for Grade 7 Rizal Mathematics
        $activeTerm = DB::table('terms')->where('school_year_id', $syId)->where('status', 'active')->first();
        if ($maria && $firstSectionId && $math7 && $activeTerm) {
            $assessExists = DB::table('assessment_records')->where([
                'school_year_id' => $syId,
                'term_id' => $activeTerm->id,
                'section_id' => $firstSectionId,
                'subject_id' => $math7->id,
                'type' => 'diagnostic',
            ])->exists();

            if (! $assessExists) {
                DB::table('assessment_records')->insert([
                    'school_year_id' => $syId,
                    'term_id' => $activeTerm->id,
                    'grade_level_id' => $gradeIds[7],
                    'section_id' => $firstSectionId,
                    'subject_id' => $math7->id,
                    'teacher_id' => $maria->id,
                    'type' => 'diagnostic',
                    'total_items' => 50,
                    'raw_scores' => json_encode([38, 42, 45, 39, 44, 40, 41, 43, 37, 46]),
                    'no_of_entries' => 10,
                    'mean' => 41.50,
                    'mps' => 83.00,
                    'sd' => 2.92,
                    'highest_score' => 46.00,
                    'lowest_score' => 37.00,
                    'least_learned_competency' => 'Evaluating algebraic expressions and polynomials',
                    'remarks' => 'Mastered',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
