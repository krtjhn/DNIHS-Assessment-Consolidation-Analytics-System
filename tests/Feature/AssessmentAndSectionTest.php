<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AssessmentAndSectionTest extends TestCase
{
    /**
     * Test Teacher can encode scores and system calculates Mean, SD, and MPS.
     */
    public function test_teacher_encodes_scores_and_calculates_deped_stats(): void
    {
        $teacher = User::where('email', 'maria.santos@dayapnhs.edu.ph')->first();

        // Raw scores: 40, 45, 50, 35, 30. Total items: 50
        // Sum = 200, N = 5, Mean = 40.00, MPS = (40 / 50) * 100 = 80.00%
        $response = $this->actingAs($teacher)
            ->postJson('/api/assessments', [
                'school_year_id'           => 1,
                'term_id'                  => 1,
                'grade_level_id'           => 1,
                'section_id'               => 1,
                'subject_id'               => 1,
                'type'                     => 'diagnostic',
                'total_items'              => 50,
                'raw_scores'               => [40, 45, 50, 35, 30],
                'least_learned_competency' => 'Operations on integers',
                'remarks'                  => 'Complete',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.mean', 40)
            ->assertJsonPath('data.mps', 80)
            ->assertJsonPath('data.no_of_entries', 5);
    }
}