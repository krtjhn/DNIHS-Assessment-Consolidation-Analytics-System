<?php

namespace Tests\Feature;

use App\Models\AssessmentRecord;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AssessmentMasteryTriggerTest extends TestCase
{
    use DatabaseTransactions;

    // Test PostgreSQL database trigger classifies all 7 DepEd mastery descriptor brackets
    public function test_trigger_assigns_deped_7_brackets_when_remarks_are_null_or_placeholder(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->first();
        $section = Section::where('school_year_id', $sy->id)->first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first();

        // Ensure no collision
        AssessmentRecord::withTrashed()->where([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'type' => 'diagnostic',
        ])->forceDelete();

        // 1. MPS >= 96.00% -> 'Mastered' (e.g. mean 48 on 50 items = 96%)
        $rec = AssessmentRecord::create([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'grade_level_id' => $section->grade_level_id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'type' => 'diagnostic',
            'total_items' => 50,
            'raw_scores' => [48, 48],
            'no_of_entries' => 2,
            'mean' => 48.00,
            'mps' => 96.00,
            'sd' => 0.00,
            'remarks' => null, // Trigger will populate
        ]);

        $this->assertSame('Mastered', $rec->fresh()->remarks);

        // 2. 86.00% - 95.99% -> 'Closely Approximating Mastery' (e.g. mean 44 on 50 items = 88%)
        $rec->update([
            'mean' => 44.00,
            'raw_scores' => [44, 44],
            'remarks' => 'Complete', // Placeholder remark should be overwritten
        ]);
        $this->assertSame('Closely Approximating Mastery', $rec->fresh()->remarks);

        // 3. 66.00% - 85.99% -> 'Moving Towards Mastery' (e.g. mean 38 on 50 items = 76%)
        $rec->update([
            'mean' => 38.00,
            'raw_scores' => [38, 38],
            'remarks' => null,
        ]);
        $this->assertSame('Moving Towards Mastery', $rec->fresh()->remarks);

        // 4. 35.00% - 65.99% -> 'Average' (e.g. mean 25 on 50 items = 50%)
        $rec->update([
            'mean' => 25.00,
            'raw_scores' => [25, 25],
            'remarks' => null,
        ]);
        $this->assertSame('Average', $rec->fresh()->remarks);

        // 5. 15.00% - 34.99% -> 'Low' (e.g. mean 12 on 50 items = 24%)
        $rec->update([
            'mean' => 12.00,
            'raw_scores' => [12, 12],
            'remarks' => null,
        ]);
        $this->assertSame('Low', $rec->fresh()->remarks);

        // 6. 5.00% - 14.99% -> 'Very Low' (e.g. mean 4 on 50 items = 8%)
        $rec->update([
            'mean' => 4.00,
            'raw_scores' => [4, 4],
            'remarks' => null,
        ]);
        $this->assertSame('Very Low', $rec->fresh()->remarks);

        // 7. < 5.00% -> 'Absolutely No Mastery' (e.g. mean 1 on 50 items = 2%)
        $rec->update([
            'mean' => 1.00,
            'raw_scores' => [1, 1],
            'remarks' => null,
        ]);
        $this->assertSame('Absolutely No Mastery', $rec->fresh()->remarks);
    }

    // Test that custom remarks provided by teacher are preserved and never overwritten
    public function test_trigger_preserves_custom_teacher_remarks(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first() ?? SchoolYear::first();
        $term = Term::where('school_year_id', $sy->id)->first();
        $section = Section::where('school_year_id', $sy->id)->first();
        $subject = Subject::where('grade_level_id', $section->grade_level_id)->first();

        // Ensure no collision
        AssessmentRecord::withTrashed()->where([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'type' => 'diagnostic',
        ])->forceDelete();

        $customNote = 'Remedial instruction scheduled on Friday';

        $rec = AssessmentRecord::create([
            'school_year_id' => $sy->id,
            'term_id' => $term->id,
            'grade_level_id' => $section->grade_level_id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'type' => 'diagnostic',
            'total_items' => 50,
            'raw_scores' => [38, 38],
            'no_of_entries' => 2,
            'mean' => 38.00,
            'mps' => 76.00,
            'sd' => 0.00,
            'remarks' => $customNote,
        ]);

        $this->assertSame($customNote, $rec->fresh()->remarks);
    }
}
