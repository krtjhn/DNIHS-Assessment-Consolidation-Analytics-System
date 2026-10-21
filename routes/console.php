<?php

use App\Models\AssessmentRecord;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use App\Services\StatsCalculatorService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Seed test assessment data for demo and testing purposes
Artisan::command('test-data:seed {--sy=2025-2026} {--term=1}', function () {
    $syName = (string) ($this->option('sy') ?: '2025-2026');
    $termNumber = (int) ($this->option('term') ?: 1);

    $this->info('============================================================');
    $this->info("   Seeding DepEd Test Data: SY {$syName} (Term {$termNumber})");
    $this->info('   Sections: Pilot A & Pilot B | Both Diagnostic & Term Exam');
    $this->info('============================================================');

    // 1. Ensure school year exists and is marked active
    $schoolYear = SchoolYear::firstOrCreate(
        ['name' => $syName],
        [
            'start_date' => '2025-06-16',
            'end_date' => '2026-03-31',
            'is_active' => true,
        ]
    );

    SchoolYear::where('id', '!=', $schoolYear->id)->update(['is_active' => false]);
    SchoolYear::where('id', $schoolYear->id)->update(['is_active' => true]);
    $this->info("[OK] School Year {$syName} set as active.");

    // 2. Ensure the requested term exists and is marked active
    $termName = match ($termNumber) {
        1 => '1st Term',
        2 => '2nd Term',
        3 => '3rd Term',
        default => "Term {$termNumber}",
    };

    $term = Term::updateOrCreate(
        [
            'school_year_id' => $schoolYear->id,
            'term_number' => $termNumber,
        ],
        [
            'name' => $termName,
            'status' => 'active',
        ]
    );

    Term::where('school_year_id', $schoolYear->id)
        ->where('id', '!=', $term->id)
        ->update(['status' => 'pending']);

    $this->info("[OK] Term '{$term->name}' (ID {$term->id}) set as active.");

    // 3. Find teacher accounts to attach to seeded records
    $teachers = User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))->get();
    if ($teachers->isEmpty()) {
        $teachers = User::where('email', 'like', '%teacher%')->get();
    }
    if ($teachers->isEmpty()) {
        $teachers = User::all();
    }

    $defaultTeacher = $teachers->first() ?? User::first();
    if (! $defaultTeacher) {
        $this->error('No teacher or user account found. Please create a user first.');

        return 1;
    }
    $this->info("[OK] Using {$teachers->count()} teacher account(s) for assignments.");

    // 4. Sample least learned competencies per subject
    $competencyMap = [
        'Mathematics' => [
            'Factoring polynomials and quadratic equations',
            'Solving linear inequalities in two variables',
            'Applying Pythagorean theorem in real-life problems',
            'Proving geometric properties and congruency',
        ],
        'Science' => [
            'Balancing complex chemical equations',
            'Explaining cellular respiration and photosynthesis',
            'Differentiating plate tectonic boundaries',
            'Calculating work, energy, and electrical power',
        ],
        'English' => [
            'Determining active and passive voice in informative texts',
            'Analyzing figures of speech and literary devices',
            'Using proper conditional statements and modals',
            'Evaluating truthfulness and relevance of ideas',
        ],
        'Filipino' => [
            'Pagsusuri sa mga tayutay at idyomatikong pahayag',
            'Pagkilala sa mga salitang nagpapahayag ng pagsang-ayon',
            'Pang-ugnay sa paglalahad ng sariling opinyon',
            'Pag-unawa sa mahahalagang kaisipan sa akdang pampanitikan',
        ],
        'Araling Panlipunan' => [
            'Impluwensya ng heograpiya sa pag-unlad ng kabihasnan',
            'Pagtukoy sa mga sanhi at bunga ng Kolonyalismo',
            'Pagsusuri sa mga salik ng produksyon at implasyon',
            'Kahalagahan ng aktibong pakikilahok sa gawaing pansibiko',
        ],
        'MAPEH' => [
            'Executing basic rhythmic steps of Philippine folk dances',
            'Recognizing intervals and harmonic textures in music',
            'Applying first aid for exercise-related injuries',
            'Analyzing the nutritional needs of adolescents',
        ],
        'Values Education' => [
            'Pagtataguyod ng wastong pagpapasya sa gitna ng suliranin',
            'Paggalang sa karapatang pantao at dignidad ng kapwa',
            'Pagsasabuhay ng katapatan sa salita at sa gawa',
            'Pag-unawa sa pananagutan ng kabataan sa lipunan',
        ],
        'TLE' => [
            'Operating and maintaining hand tools according to safety standards',
            'Preparing mensuration and calculation in drafting/carpentry',
            'Interpreting technical drawings and electronic schematics',
            'Sanitizing food preparation surfaces and hazard control',
        ],
    ];

    $standardSubjects = [
        'Mathematics',
        'Science',
        'English',
        'Filipino',
        'Araling Panlipunan',
        'MAPEH',
        'Values Education',
        'TLE',
    ];

    $statsCalc = app(StatsCalculatorService::class);
    $gradeLevels = GradeLevel::whereIn('level', [7, 8, 9, 10])->orderBy('level')->get();

    // Clean up or rename any old section named Pilot to Pilot A
    Section::where('name', 'Pilot')->update(['name' => 'Pilot A']);

    $termExamsCreated = 0;
    $diagTestsCreated = 0;
    $sectionsProcessed = [];
    $teacherIndex = 0;

    foreach ($gradeLevels as $grade) {
        // Ensure all standard subjects exist for this grade level
        foreach ($standardSubjects as $subName) {
            Subject::firstOrCreate(
                [
                    'grade_level_id' => $grade->id,
                    'name' => $subName,
                ],
                [
                    'code' => strtoupper(substr(str_replace(' ', '', $subName), 0, 4)).$grade->level,
                    'is_active' => true,
                ]
            );
        }

        $subjects = Subject::where('grade_level_id', $grade->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Target test sections: Pilot A and Pilot B
        $targetSections = ['Pilot A', 'Pilot B'];

        foreach ($targetSections as $sectionName) {
            // Find existing section or create a new one
            $section = Section::where('grade_level_id', $grade->id)
                ->where(function ($q) use ($sectionName) {
                    $q->whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($sectionName))])
                        ->orWhere('name', 'like', "%{$sectionName}%");
                })
                ->first();

            if ($section) {
                $section->update([
                    'school_year_id' => $schoolYear->id,
                    'name' => $sectionName,
                    'is_active' => true,
                ]);
            } else {
                $section = Section::create([
                    'school_year_id' => $schoolYear->id,
                    'grade_level_id' => $grade->id,
                    'name' => $sectionName,
                    'is_active' => true,
                ]);
            }

            $sectionsProcessed[] = "Grade {$grade->level} - {$section->name}";

            foreach ($subjects as $subject) {
                $teacher = $teachers[$teacherIndex % $teachers->count()] ?? $defaultTeacher;
                $teacherIndex++;

                $totalItems = 50;
                $examineeCount = rand(36, 44);

                // Score distribution aiming for an average of 36 to 42 (MPS 72% to 84%)
                $targetMean = rand(360, 420) / 10.0;
                $targetSd = rand(45, 65) / 10.0;

                $scores = [];
                for ($i = 0; $i < $examineeCount; $i++) {
                    $u1 = max(1e-6, mt_rand() / mt_getrandmax());
                    $u2 = max(1e-6, mt_rand() / mt_getrandmax());
                    $randStdNormal = sqrt(-2.0 * log($u1)) * cos(2.0 * M_PI * $u2);
                    $val = round($targetMean + ($randStdNormal * $targetSd));
                    $scores[] = (int) max(14, min($totalItems, $val));
                }

                $stats = $statsCalc->calculate($scores, $totalItems);
                $competencies = $competencyMap[$subject->name] ?? ['Curriculum foundational competencies'];
                $competency = $competencies[array_rand($competencies)];

                // Create or update term exam record tagged with TEST_DATA
                AssessmentRecord::updateOrCreate(
                    [
                        'school_year_id' => $schoolYear->id,
                        'term_id' => $term->id,
                        'section_id' => $section->id,
                        'subject_id' => $subject->id,
                        'type' => 'term_exam',
                    ],
                    [
                        'grade_level_id' => $grade->id,
                        'teacher_id' => $teacher->id,
                        'total_items' => $totalItems,
                        'raw_scores' => $scores,
                        'no_of_entries' => count($scores),
                        'mean' => $stats['mean'],
                        'mps' => $stats['mps'],
                        'sd' => $stats['sd'],
                        'highest_score' => $stats['highest_score'],
                        'lowest_score' => $stats['lowest_score'],
                        'least_learned_competency' => $competency,
                        'remarks' => 'Complete [TEST_DATA]',
                    ]
                );
                $termExamsCreated++;

                // Create or update diagnostic test record tagged with TEST_DATA
                $diagMean = rand(310, 370) / 10.0;
                $diagScores = [];
                for ($i = 0; $i < $examineeCount; $i++) {
                    $u1 = max(1e-6, mt_rand() / mt_getrandmax());
                    $u2 = max(1e-6, mt_rand() / mt_getrandmax());
                    $randStdNormal = sqrt(-2.0 * log($u1)) * cos(2.0 * M_PI * $u2);
                    $val = round($diagMean + ($randStdNormal * $targetSd));
                    $diagScores[] = (int) max(10, min($totalItems, $val));
                }
                $diagStats = $statsCalc->calculate($diagScores, $totalItems);

                AssessmentRecord::updateOrCreate(
                    [
                        'school_year_id' => $schoolYear->id,
                        'term_id' => $term->id,
                        'section_id' => $section->id,
                        'subject_id' => $subject->id,
                        'type' => 'diagnostic',
                    ],
                    [
                        'grade_level_id' => $grade->id,
                        'teacher_id' => $teacher->id,
                        'total_items' => $totalItems,
                        'raw_scores' => $diagScores,
                        'no_of_entries' => count($diagScores),
                        'mean' => $diagStats['mean'],
                        'mps' => $diagStats['mps'],
                        'sd' => $diagStats['sd'],
                        'highest_score' => $diagStats['highest_score'],
                        'lowest_score' => $diagStats['lowest_score'],
                        'least_learned_competency' => $competency,
                        'remarks' => 'Complete [TEST_DATA]',
                    ]
                );
                $diagTestsCreated++;
            }
        }
    }

    $this->info('[OK] Successfully seeded test data:');
    $this->line('  - Sections configured: '.implode(', ', array_unique($sectionsProcessed)));
    $this->line("  - {$termExamsCreated} Term Exam records seeded (Type: 'term_exam', Remarks: 'Complete [TEST_DATA]')");
    $this->line("  - {$diagTestsCreated} Diagnostic Test records seeded (Type: 'diagnostic', Remarks: 'Complete [TEST_DATA]')");
    $this->line('  - Total Assessment Records: '.($termExamsCreated + $diagTestsCreated));
    $this->info('[OK] All school-wide tables and per-grade views now have complete test data.');
    $this->comment('To wipe all test data anytime, run: php artisan test-data:clear');
})->purpose('Seed test assessment data for SY 2025-2026 Term 1 (Pilot A & Pilot B, all subjects, Term Exam & Diagnostic)');

// Wipe test assessment records for a specific school year and term
Artisan::command('test-data:clear {--sy=2025-2026} {--term=1} {--with-sections}', function () {
    $syName = (string) ($this->option('sy') ?: '2025-2026');
    $termNumber = (int) ($this->option('term') ?: 1);
    $withSections = (bool) $this->option('with-sections');

    $this->info("=== Removing Test Data for SY {$syName} (Term {$termNumber}) ===");

    $schoolYear = SchoolYear::where('name', $syName)->first();
    if (! $schoolYear) {
        $this->warn("School Year '{$syName}' was not found in the database.");

        return 0;
    }

    $term = Term::where('school_year_id', $schoolYear->id)
        ->where('term_number', $termNumber)
        ->first();

    $deleted = AssessmentRecord::where('school_year_id', $schoolYear->id)
        ->when($term, fn ($q) => $q->where('term_id', $term->id))
        ->where('remarks', 'like', '%TEST_DATA%')
        ->delete();

    $this->info("[OK] Cleaned up test assessment data for SY {$syName} Term {$termNumber}:");
    $this->line("  - {$deleted} Assessment records deleted.");

    if ($withSections) {
        $deletedSections = Section::where('school_year_id', $schoolYear->id)
            ->whereIn('name', ['Pilot A', 'Pilot B'])
            ->delete();
        $this->line("  - {$deletedSections} test sections (Pilot A & Pilot B) removed.");
    }

    $this->info('[OK] Database test records have been safely cleared.');
})->purpose('Safely clear test assessment records for a specific School Year and Term');

// Automated database backup schedule (Runs nightly at 2:00 AM with overlapping protection)
Schedule::command('db:backup')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground();

