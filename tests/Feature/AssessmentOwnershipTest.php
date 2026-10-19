<?php

namespace Tests\Feature;

use App\Models\AssessmentRecord;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeachingAssignment;
use App\Models\Term;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AssessmentOwnershipTest extends TestCase
{
    use DatabaseTransactions;

    protected function createTestRecord(array $attrs): AssessmentRecord
    {
        AssessmentRecord::withTrashed()->where([
            'school_year_id' => $attrs['school_year_id'],
            'term_id' => $attrs['term_id'],
            'section_id' => $attrs['section_id'],
            'subject_id' => $attrs['subject_id'],
            'type' => $attrs['type'],
        ])->forceDelete();

        return AssessmentRecord::create($attrs);
    }

    // Test a teacher only receives their own recorded score sheets in the assessments index
    public function test_teacher_only_receives_own_records_in_assessments_index(): void
    {
        $teacher1 = User::where('email', 'maria.santos@gmail.com')->first();
        $teacher2 = User::where('email', 'juan.delacruz@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first() ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        // Create an assessment record for Teacher 2
        $record2 = $this->createTestRecord([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'grade_level_id' => $section->grade_level_id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher2->id,
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

        // When Teacher 1 lists assessments, Teacher 2's record must not appear
        $response = $this->actingAs($teacher1)->getJson('/api/assessments');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertNotContains($record2->id, $ids);
    }

    // Test a teacher cannot update another teacher's assessment record (403 Forbidden)
    public function test_teacher_cannot_update_another_teachers_record(): void
    {
        $teacher1 = User::where('email', 'maria.santos@gmail.com')->first();
        $teacher2 = User::where('email', 'juan.delacruz@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first() ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        $record2 = $this->createTestRecord([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'grade_level_id' => $section->grade_level_id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher2->id,
            'type' => 'diagnostic',
            'total_items' => 50,
            'raw_scores' => [30, 35, 40],
            'no_of_entries' => 3,
            'mean' => 35.0,
            'mps' => 70.0,
            'sd' => 5.0,
            'highest_score' => 40.0,
            'lowest_score' => 30.0,
            'least_learned_competency' => 'Vocabulary',
            'remarks' => 'Complete',
        ]);

        $response = $this->actingAs($teacher1)->putJson("/api/assessments/{$record2->id}", [
            'total_items' => 50,
            'raw_scores' => [45, 45, 45],
            'least_learned_competency' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    // Test a teacher cannot delete another teacher's assessment record (403 Forbidden)
    public function test_teacher_cannot_delete_another_teachers_record(): void
    {
        $teacher1 = User::where('email', 'maria.santos@gmail.com')->first();
        $teacher2 = User::where('email', 'juan.delacruz@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first() ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        $record2 = $this->createTestRecord([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'grade_level_id' => $section->grade_level_id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher2->id,
            'type' => 'diagnostic',
            'total_items' => 50,
            'raw_scores' => [30, 35],
            'no_of_entries' => 2,
            'mean' => 32.5,
            'mps' => 65.0,
            'sd' => 3.5,
            'highest_score' => 35.0,
            'lowest_score' => 30.0,
            'least_learned_competency' => 'Algebra',
            'remarks' => 'Complete',
        ]);

        $response = $this->actingAs($teacher1)->deleteJson("/api/assessments/{$record2->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('assessment_records', ['id' => $record2->id]);
    }

    // Test a teacher cannot overwrite an existing assessment recorded by another teacher
    public function test_teacher_cannot_overwrite_existing_record_of_another_teacher(): void
    {
        $teacher1 = User::where('email', 'maria.santos@gmail.com')->first();
        $teacher2 = User::where('email', 'juan.delacruz@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->where('status', 'active')->first() ?? Term::first();
        $section = Section::where('school_year_id', $sy->id)->first() ?? Section::first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();

        // Ensure teacher1 is assigned to class so teaching assignment check passes
        TeachingAssignment::where([
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ])->delete();

        TeachingAssignment::create([
            'user_id' => $teacher1->id,
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'effective_from' => now()->toDateString(),
        ]);

        AssessmentRecord::withTrashed()->where([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'type' => 'diagnostic',
        ])->forceDelete();

        AssessmentRecord::create([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'grade_level_id' => $section->grade_level_id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher2->id,
            'type' => 'diagnostic',
            'total_items' => 50,
            'raw_scores' => [30, 35],
            'no_of_entries' => 2,
            'mean' => 32.5,
            'mps' => 65.0,
            'sd' => 3.5,
            'highest_score' => 35.0,
            'lowest_score' => 30.0,
            'least_learned_competency' => 'Algebra',
            'remarks' => 'Complete',
        ]);

        // Teacher 1 tries to POST to the same exact slot
        $response = $this->actingAs($teacher1)->postJson('/api/assessments', [
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'grade_level_id' => $section->grade_level_id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'type' => 'diagnostic',
            'total_items' => 50,
            'raw_scores' => [50, 50],
            'least_learned_competency' => 'Overwritten',
            'remarks' => 'Attempted Overwrite',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', "This assessment was already recorded by {$teacher2->name}. You cannot overwrite another teacher's score sheet.");
    }

    // Test admin can update any teacher's assessment record (Issue 9 resolved)
    public function test_admin_can_update_any_teachers_record(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $record = AssessmentRecord::first();
        if (! $record) {
            $sy = SchoolYear::active()->first() ?? SchoolYear::first();
            $term = Term::where('school_year_id', $sy->id)->first() ?? Term::first();
            $section = Section::first();
            $subject = Subject::where('grade_level_id', $section->grade_level_id)->first() ?? Subject::first();
            $teacher = User::where('email', 'maria.santos@gmail.com')->first();

            $record = $this->createTestRecord([
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

        $response = $this->actingAs($admin)->putJson("/api/assessments/{$record->id}", [
            'total_items' => 50,
            'raw_scores' => [48, 49, 50],
            'least_learned_competency' => 'Admin updated competency',
            'remarks' => 'Admin verification',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Assessment scores updated and recalculated successfully.');
    }

    // Test admin can view all assessments in consolidation report regardless of teacher
    public function test_admin_can_view_all_assessments_in_consolidation(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->first() ?? Term::first();

        $response = $this->actingAs($admin)->getJson("/api/assessments/consolidation?school_year_id={$sy->id}&term_id={$term->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'total_sections_encoded',
                    'total_examinees',
                    'overall_mean',
                    'overall_mps',
                    'overall_sd',
                ],
                'records',
            ]);
    }
}
