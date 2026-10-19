<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class TeacherAssignmentTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_view_all_teaching_assignments(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first();
        $section = Section::first();
        $subject = Subject::first();

        TeachingAssignment::firstOrCreate([
            'user_id' => $teacher->id,
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ], [
            'effective_from' => '2025-06-16',
            'assigned_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/teaching-assignments');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'user_id', 'section_id', 'subject_id', 'effective_from']]]);
    }

    public function test_teacher_can_view_own_assignments(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();

        $response = $this->actingAs($teacher)->getJson('/api/my-classes');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_admin_cannot_assign_class_that_is_already_taken(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first();
        $subject = Subject::first();
        $section = Section::where('name', 'Pilot A')->first() ?? Section::create([
            'school_year_id' => $sy->id,
            'grade_level_id' => $subject->grade_level_id,
            'name' => 'TestSec_' . uniqid(),
            'is_active' => true,
        ]);

        // 1. Initial assignment
        $response1 = $this->actingAs($admin)->postJson('/api/teaching-assignments', [
            'user_id' => $teacher->id,
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'effective_from' => '2025-06-16',
        ]);

        $response1->assertStatus(201)
            ->assertJsonPath('data.user_id', $teacher->id);

        // 2. Re-assigning to another user is strictly blocked (422)
        $anotherTeacher = User::create([
            'name' => 'Test Teacher',
            'email' => 'test.teacher_'.uniqid().'@gmail.com',
            'password' => bcrypt('Password@123'),
            'is_active' => true,
            'approval_status' => 'approved',
        ]);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher'], ['description' => 'Teacher']);
        $anotherTeacher->roles()->attach($teacherRole->id);

        $response2 = $this->actingAs($admin)->postJson('/api/teaching-assignments', [
            'user_id' => $anotherTeacher->id,
            'school_year_id' => $sy->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'effective_from' => '2025-06-16',
        ]);

        $response2->assertStatus(422)
            ->assertJsonPath('message', "This class is already assigned to {$teacher->name}. It cannot be reassigned while taken.");
    }

    public function test_admin_can_bulk_sync_teacher_loads(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first();
        $sections = Section::take(2)->get();
        $subjects = Subject::take(2)->get();

        $response = $this->actingAs($admin)->postJson('/api/teaching-assignments/sync', [
            'user_id' => $teacher->id,
            'school_year_id' => $sy->id,
            'assignments' => [
                ['section_id' => $sections[0]->id, 'subject_id' => $subjects[0]->id],
                ['section_id' => $sections[1]->id, 'subject_id' => $subjects[1]->id],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Teaching assignments updated successfully.');

        $activeLoads = TeachingAssignment::forTeacher($teacher->id)
            ->forSchoolYear($sy->id)
            ->active()
            ->count();

        $this->assertEquals(2, $activeLoads);
    }

    public function test_teacher_cannot_manage_assignments(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();
        $sy = SchoolYear::active()->first();

        $response = $this->actingAs($teacher)->postJson('/api/teaching-assignments', [
            'user_id' => $teacher->id,
            'school_year_id' => $sy->id,
            'section_id' => 1,
            'subject_id' => 1,
            'effective_from' => '2025-06-16',
        ]);

        $response->assertStatus(403);
    }
}
