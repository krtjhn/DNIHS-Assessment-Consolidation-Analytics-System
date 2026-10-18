<?php

namespace Tests\Feature;

use App\Models\AssessmentRecord;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeachingAssignment;
use App\Models\Term;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AssessmentAndSectionTest extends TestCase
{
    use DatabaseTransactions;

    // Test Teacher can encode scores and system calculates Mean, SD, and MPS
    public function test_teacher_encodes_scores_and_calculates_deped_stats(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first()
            ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        // Ensure active teaching assignment exists
        TeachingAssignment::firstOrCreate([
            'user_id' => $teacher->id,
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ], [
            'effective_from' => now()->toDateString(),
        ]);

        // Clear any existing collision for this specific test slot
        AssessmentRecord::where([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'type' => 'diagnostic',
        ])->delete();

        // Raw scores: 40, 45, 50, 35, 30. Total items: 50
        // Sum = 200, N = 5, Mean = 40.00, MPS = (40 / 50) * 100 = 80.00%
        $response = $this->actingAs($teacher)
            ->postJson('/api/assessments', [
                'school_year_id' => $sy->id,
                'term_id' => $term->id,
                'grade_level_id' => $section->grade_level_id,
                'section_id' => $section->id,
                'subject_id' => $subject->id,
                'type' => 'diagnostic',
                'total_items' => 50,
                'raw_scores' => [40, 45, 50, 35, 30],
                'least_learned_competency' => 'Operations on integers',
                'remarks' => 'Complete',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.mean', 40)
            ->assertJsonPath('data.mps', 80)
            ->assertJsonPath('data.no_of_entries', 5);
    }

    // Test cannot submit individual score exceeding total items (Issue 2)
    public function test_cannot_submit_score_exceeding_total_items(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first() ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        TeachingAssignment::firstOrCreate([
            'user_id' => $teacher->id,
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ], [
            'effective_from' => now()->toDateString(),
        ]);

        $response = $this->actingAs($teacher)
            ->postJson('/api/assessments', [
                'school_year_id' => $sy->id,
                'term_id' => $term->id,
                'grade_level_id' => $section->grade_level_id,
                'section_id' => $section->id,
                'subject_id' => $subject->id,
                'type' => 'diagnostic',
                'total_items' => 50,
                'raw_scores' => [40, 55], // 55 > 50 (invalid)
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['raw_scores.1']);
    }

    // Test unassigned teacher cannot record scores for a class (Issue 3)
    public function test_unassigned_teacher_cannot_record_assessment(): void
    {
        $teacher = User::where('email', 'juan.delacruz@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first() ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        // Ensure teacher is NOT assigned to this section/subject
        TeachingAssignment::where([
            'user_id' => $teacher->id,
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ])->delete();

        $response = $this->actingAs($teacher)
            ->postJson('/api/assessments', [
                'school_year_id' => $sy->id,
                'term_id' => $term->id,
                'grade_level_id' => $section->grade_level_id,
                'section_id' => $section->id,
                'subject_id' => $subject->id,
                'type' => 'diagnostic',
                'total_items' => 50,
                'raw_scores' => [40, 45],
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You are not assigned to teach this class. Only assigned teachers or administrators can record scores.');
    }

    // Test cannot delete section that contains recorded assessment scores (Issue 5)
    public function test_cannot_delete_section_with_assessment_records(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $record = AssessmentRecord::first();
        if (! $record) {
            $sy = SchoolYear::active()->first() ?? SchoolYear::first();
            $term = Term::where('school_year_id', $sy->id)->first() ?? Term::first();
            $section = Section::first();
            $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();
            $teacher = User::where('email', 'maria.santos@gmail.com')->first();

            $record = AssessmentRecord::create([
                'school_year_id' => $sy->id,
                'term_id' => $term->id,
                'grade_level_id' => $section->grade_level_id,
                'section_id' => $section->id,
                'subject_id' => $subject->id,
                'teacher_id' => $teacher->id,
                'type' => 'diagnostic',
                'total_items' => 50,
                'raw_scores' => [40, 42, 38],
                'no_of_entries' => 3,
                'mean' => 40.0,
                'mps' => 80.0,
                'sd' => 2.0,
                'highest_score' => 42.0,
                'lowest_score' => 38.0,
                'least_learned_competency' => 'Fractions',
                'remarks' => 'Complete',
            ]);
        }
        $this->assertNotNull($record, 'Assessment record fixture required');

        $section = $record->section;

        $response = $this->actingAs($admin)->deleteJson("/api/sections/{$section->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot delete section because it contains recorded assessment scores. Archive or deactivate the section instead to preserve historical records.');

        $this->assertDatabaseHas('sections', ['id' => $section->id]);
    }

    // Test cross-grade section mismatch is rejected (Issue 8)
    public function test_cross_grade_section_mismatch_is_rejected(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first() ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $otherGrade = GradeLevel::where('id', '!=', $section->grade_level_id)->first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        $response = $this->actingAs($admin)
            ->postJson('/api/assessments', [
                'school_year_id' => $sy->id,
                'term_id' => $term->id,
                'grade_level_id' => $otherGrade->id, // Mismatched grade level
                'section_id' => $section->id,
                'subject_id' => $subject->id,
                'type' => 'diagnostic',
                'total_items' => 50,
                'raw_scores' => [40, 45],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['section_id']);
    }

    // Test authenticated staff can fetch consolidated assessment reports
    public function test_authenticated_staff_can_fetch_consolidation_report(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->first() ?? Term::first();

        $response = $this->actingAs($teacher)
            ->getJson("/api/assessments/consolidation?school_year_id={$sy->id}&term_id={$term->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'total_sections_encoded',
                    'total_examinees',
                    'overall_mean',
                    'overall_mps',
                    'overall_sd',
                    'overall_mastery',
                ],
                'records',
            ]);
    }
}
