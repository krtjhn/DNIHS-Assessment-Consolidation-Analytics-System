<?php

namespace Database\Seeders;

use App\Models\AssessmentRecord;
use App\Models\GradeLevel;
use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeachingAssignment;
use App\Models\Term;
use App\Models\User;
use App\Services\StatsCalculatorService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

// Dedicated demo data seeder for frontend documentation, UI screenshots, and panel presentation
class DemoFrontendSeeder extends Seeder
{
    // Seed realistic faculty, sections, workloads, and 1st term assessment score sheets
    public function run(): void
    {
        $statsCalculator = new StatsCalculatorService;

        // 1. Fetch pre-existing master data provisioned by core system migrations
        $admin = User::where('email', 'admin@gmail.com')->firstOrFail();
        $teacherRole = Role::where('name', 'teacher')->firstOrFail();
        $schoolYear = SchoolYear::where('name', '2025-2026')->where('is_active', true)->firstOrFail();
        $firstTerm = Term::where('school_year_id', $schoolYear->id)->where('term_number', 1)->firstOrFail();
        $gradeLevels = GradeLevel::whereIn('level', [7, 8, 9, 10])->get()->keyBy('level');

        // 2. Provision the 3 Teachers with full names, approved status, and standard credentials
        $teacherConfigs = [
            [
                'name' => 'Kurt John P. Caraig',
                'email' => 'kurtjohn.caraig@gmail.com',
            ],
            [
                'name' => 'Norwin L. Austria',
                'email' => 'norwin.austria@gmail.com',
            ],
            [
                'name' => 'Daisuke Reggie C. Bati',
                'email' => 'daisukereggie.bati@gmail.com',
            ],
        ];

        $teachers = [];
        foreach ($teacherConfigs as $cfg) {
            $teacher = User::updateOrCreate(
                ['email' => $cfg['email']],
                [
                    'name' => $cfg['name'],
                    'password' => Hash::make('Password@123'),
                    'is_active' => true,
                    'approval_status' => 'approved',
                    'approved_at' => now(),
                ]
            );

            // Attach teacher role idempotently
            $teacher->roles()->syncWithoutDetaching([$teacherRole->id]);
            $teachers[$cfg['name']] = $teacher;
        }

        // 3. Create 2 Sections per Grade Level (Pilot A and Pilot B) under the active school year
        $sections = [];
        foreach ($gradeLevels as $lvl => $grade) {
            foreach (['Pilot A', 'Pilot B'] as $secName) {
                $section = Section::firstOrCreate(
                    [
                        'school_year_id' => $schoolYear->id,
                        'grade_level_id' => $grade->id,
                        'name' => $secName,
                    ],
                    [
                        'is_active' => true,
                    ]
                );
                $sections[$lvl][$secName] = $section;
            }
        }

        // Helper to retrieve subject by grade and curriculum code
        $getSubject = function (int $level, string $prefix) use ($gradeLevels) {
            return Subject::where('grade_level_id', $gradeLevels[$level]->id)
                ->where('code', "{$prefix}-{$level}")
                ->firstOrFail();
        };

        // 4. Define Teaching Workloads and 1st Term Assessment Score Sheets
        $curriculumDataset = [
            // Kurt John P. Caraig (Mathematics & Science)
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 7,
                'section' => 'Pilot A',
                'prefix' => 'MATH',
                'target_mean' => 43.8,
                'spread' => 3.2,
                'competency' => 'Translating verbal phrases into mathematical expressions and equations',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 7,
                'section' => 'Pilot A',
                'prefix' => 'SCI',
                'target_mean' => 41.5,
                'spread' => 3.8,
                'competency' => 'Differentiating mixtures from substances based on a set of properties',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 7,
                'section' => 'Pilot B',
                'prefix' => 'MATH',
                'target_mean' => 37.2,
                'spread' => 4.5,
                'competency' => 'Applying properties of operations on integers and rational numbers',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 7,
                'section' => 'Pilot B',
                'prefix' => 'SCI',
                'target_mean' => 36.4,
                'spread' => 4.2,
                'competency' => 'Investigating properties of acidic and basic solutions using litmus indicators',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 8,
                'section' => 'Pilot A',
                'prefix' => 'MATH',
                'target_mean' => 45.6,
                'spread' => 2.8,
                'competency' => 'Factoring completely different types of polynomials (common monomial factor, difference of two squares)',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 8,
                'section' => 'Pilot A',
                'prefix' => 'SCI',
                'target_mean' => 43.2,
                'spread' => 3.4,
                'competency' => 'Investigating Newton’s Laws of Motion: Law of Acceleration and Mass Interaction',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 8,
                'section' => 'Pilot B',
                'prefix' => 'MATH',
                'target_mean' => 35.8,
                'spread' => 4.6,
                'competency' => 'Illustrating rational algebraic expressions and finding their simplest form',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 8,
                'section' => 'Pilot B',
                'prefix' => 'SCI',
                'target_mean' => 38.0,
                'spread' => 4.0,
                'competency' => 'Relating work and energy to potential and kinetic mechanical states',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 9,
                'section' => 'Pilot A',
                'prefix' => 'MATH',
                'target_mean' => 48.2,
                'spread' => 1.8,
                'competency' => 'Solving quadratic equations by extracting square roots and quadratic formula',
            ],
            [
                'teacher' => 'Kurt John P. Caraig',
                'level' => 10,
                'section' => 'Pilot A',
                'prefix' => 'MATH',
                'target_mean' => 44.5,
                'spread' => 3.1,
                'competency' => 'Generating patterns and determining the nth term of arithmetic and geometric sequences',
            ],

            // Norwin L. Austria (English & Filipino)
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 7,
                'section' => 'Pilot A',
                'prefix' => 'ENG',
                'target_mean' => 43.5,
                'spread' => 3.3,
                'competency' => 'Employing appropriate styles of reading (skimming, scanning, intensive) for purpose',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 7,
                'section' => 'Pilot A',
                'prefix' => 'FIL',
                'target_mean' => 46.2,
                'spread' => 2.5,
                'competency' => 'Paghahambing ng mga katangian ng tula/awiting panudyo, tugmang de gulong at palaisipan',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 7,
                'section' => 'Pilot B',
                'prefix' => 'ENG',
                'target_mean' => 38.2,
                'spread' => 4.2,
                'competency' => 'Identifying the genre and features of diverse viewing materials',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 7,
                'section' => 'Pilot B',
                'prefix' => 'FIL',
                'target_mean' => 40.5,
                'spread' => 3.6,
                'competency' => 'Pagsusuri ng mga elemento ng kuwentong-bayan sa binasang akda',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 8,
                'section' => 'Pilot A',
                'prefix' => 'ENG',
                'target_mean' => 44.8,
                'spread' => 3.0,
                'competency' => 'Determining the meaning of idiomatic expressions by noting context clues and collocations',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 8,
                'section' => 'Pilot A',
                'prefix' => 'FIL',
                'target_mean' => 47.0,
                'spread' => 2.2,
                'competency' => 'Pagpapaliwanag sa kahalagahan ng paggamit ng angkop na gramatika at retorika sa panitikang Pilipino',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 8,
                'section' => 'Pilot B',
                'prefix' => 'ENG',
                'target_mean' => 36.5,
                'spread' => 4.4,
                'competency' => 'Using appropriate cohesive devices in composing informative paragraphs',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 8,
                'section' => 'Pilot B',
                'prefix' => 'FIL',
                'target_mean' => 39.2,
                'spread' => 3.8,
                'competency' => 'Pagbibigay kahulugan sa mga talinghaga at eupemistikong pahayag sa akda',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 9,
                'section' => 'Pilot A',
                'prefix' => 'ENG',
                'target_mean' => 45.4,
                'spread' => 2.9,
                'competency' => 'Expressing permission, obligation, and prohibition using modal verbs in writing',
            ],
            [
                'teacher' => 'Norwin L. Austria',
                'level' => 10,
                'section' => 'Pilot A',
                'prefix' => 'ENG',
                'target_mean' => 44.0,
                'spread' => 3.2,
                'competency' => 'Determining the effect of textual aids like advanced organizers and diagrams on comprehension',
            ],

            // Daisuke Reggie C. Bati (MAPEH, TLE & Araling Panlipunan)
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 7,
                'section' => 'Pilot A',
                'prefix' => 'MAPEH',
                'target_mean' => 45.0,
                'spread' => 2.9,
                'competency' => 'Executing fundamental skills and rhythmic movements in traditional folk dances',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 7,
                'section' => 'Pilot A',
                'prefix' => 'TLE',
                'target_mean' => 42.8,
                'spread' => 3.5,
                'competency' => 'Applying occupational health and safety (OHS) procedures in exploratory technical trades',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 7,
                'section' => 'Pilot A',
                'prefix' => 'AP',
                'target_mean' => 41.0,
                'spread' => 3.9,
                'competency' => 'Naipapaliwanag ang konsepto ng Asya tungo sa paghahating heograpiko (Silangang Asya, Timog-Silangang Asya)',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 8,
                'section' => 'Pilot A',
                'prefix' => 'MAPEH',
                'target_mean' => 46.5,
                'spread' => 2.4,
                'competency' => 'Executing the basic skills and offensive/defensive tactics in team sports (basketball/volleyball)',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 8,
                'section' => 'Pilot A',
                'prefix' => 'TLE',
                'target_mean' => 43.5,
                'spread' => 3.2,
                'competency' => 'Interpreting technical drawings, diagrams, and electrical schematic symbols accurately',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 8,
                'section' => 'Pilot A',
                'prefix' => 'AP',
                'target_mean' => 39.8,
                'spread' => 4.1,
                'competency' => 'Pagsusuri sa yugto ng pag-unlad ng kultura sa panahong prehistoriko sa daigdig',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 9,
                'section' => 'Pilot A',
                'prefix' => 'MAPEH',
                'target_mean' => 48.5,
                'spread' => 1.5,
                'competency' => 'Performing social and ballroom dances to maintain active community lifestyle and physical fitness',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 9,
                'section' => 'Pilot A',
                'prefix' => 'AP',
                'target_mean' => 43.2,
                'spread' => 3.3,
                'competency' => 'Natataya ang kahalagahan ng ekonomiks sa matalinong pagpapasya sa pang-araw-araw na pamumuhay',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 10,
                'section' => 'Pilot A',
                'prefix' => 'MAPEH',
                'target_mean' => 46.0,
                'spread' => 2.6,
                'competency' => 'Applying consumer health concepts in selecting trustworthy health information and healthcare products',
            ],
            [
                'teacher' => 'Daisuke Reggie C. Bati',
                'level' => 10,
                'section' => 'Pilot A',
                'prefix' => 'TLE',
                'target_mean' => 44.2,
                'spread' => 3.0,
                'competency' => 'Configuring computer systems and local area networks adhering to structured cabling standards',
            ],
        ];

        // 5. Execute workload allocation and assessment score sheet seeding
        foreach ($curriculumDataset as $data) {
            $teacher = $teachers[$data['teacher']];
            $grade = $gradeLevels[$data['level']];
            $section = $sections[$data['level']][$data['section']];
            $subject = $getSubject($data['level'], $data['prefix']);

            // Active teaching assignment (effective_until is null)
            TeachingAssignment::firstOrCreate(
                [
                    'school_year_id' => $schoolYear->id,
                    'section_id' => $section->id,
                    'subject_id' => $subject->id,
                    'effective_until' => null,
                ],
                [
                    'user_id' => $teacher->id,
                    'effective_from' => '2025-06-16',
                    'assigned_by' => $admin->id,
                ]
            );

            // Generate realistic student exam scores (40 examinees per section, total items 50)
            $scores = $this->generateScoreDistribution(40, $data['target_mean'], $data['spread'], 50);
            $stats = $statsCalculator->calculate($scores, 50);

            // Insert or update assessment record for 1st Term
            AssessmentRecord::updateOrCreate(
                [
                    'school_year_id' => $schoolYear->id,
                    'term_id' => $firstTerm->id,
                    'grade_level_id' => $grade->id,
                    'section_id' => $section->id,
                    'subject_id' => $subject->id,
                    'type' => 'term_exam',
                ],
                [
                    'teacher_id' => $teacher->id,
                    'total_items' => 50,
                    'raw_scores' => $scores,
                    'no_of_entries' => $stats['no_of_entries'],
                    'mean' => $stats['mean'],
                    'mps' => $stats['mps'],
                    'sd' => $stats['sd'],
                    'highest_score' => $stats['highest_score'],
                    'lowest_score' => $stats['lowest_score'],
                    'least_learned_competency' => $data['competency'],
                    'remarks' => $stats['mastery_level'],
                ]
            );
        }
    }

    // Generate normal-like integer score distribution bounded between 0 and totalItems
    private function generateScoreDistribution(int $n, float $targetMean, float $spread, int $totalItems): array
    {
        $scores = [];
        for ($i = 0; $i < $n; $i++) {
            // Box-Muller transform for normal distribution
            $u1 = max(0.0001, mt_rand() / mt_getrandmax());
            $u2 = mt_rand() / mt_getrandmax();
            $z0 = sqrt(-2.0 * log($u1)) * cos(2.0 * M_PI * $u2);

            $score = round($targetMean + ($z0 * $spread));
            $boundedScore = (int) max(10, min($totalItems, $score));
            $scores[] = $boundedScore;
        }

        return $scores;
    }
}
