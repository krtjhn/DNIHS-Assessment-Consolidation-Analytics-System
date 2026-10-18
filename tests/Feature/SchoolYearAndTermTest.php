<?php

namespace Tests\Feature;

use App\Models\SchoolYear;
use App\Models\Term;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SchoolYearAndTermTest extends TestCase
{
    use DatabaseTransactions;

    public function test_authenticated_user_can_view_school_years(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();

        $response = $this->actingAs($teacher)->getJson('/api/school-years');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'name', 'terms']]]);
    }

    public function test_admin_can_create_school_year_and_auto_generates_three_terms(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $syName = 'SY-'.uniqid();

        $response = $this->actingAs($admin)->postJson('/api/school-years', [
            'name' => $syName,
            'start_date' => '2027-08-01',
            'end_date' => '2028-05-31',
            'is_active' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', $syName);

        $createdSY = SchoolYear::where('name', $syName)->first();
        $this->assertNotNull($createdSY);
        $this->assertCount(3, $createdSY->terms);
    }

    public function test_teacher_cannot_create_school_year(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();

        $response = $this->actingAs($teacher)->postJson('/api/school-years', [
            'name' => 'SY-Unauthorized',
            'start_date' => '2027-08-01',
            'end_date' => '2028-05-31',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_term_status_and_auto_completes_previous_active(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        $sy = SchoolYear::first();
        $term1 = $sy->terms()->where('term_number', 1)->first();
        $term2 = $sy->terms()->where('term_number', 2)->first();

        // 1. Activate term 1
        $this->actingAs($admin)->patchJson("/api/terms/{$term1->id}/status", [
            'status' => 'active',
        ])->assertStatus(200);

        $this->assertEquals('active', $term1->fresh()->status);

        // 2. Activate term 2, term 1 should automatically become 'completed'
        $this->actingAs($admin)->patchJson("/api/terms/{$term2->id}/status", [
            'status' => 'active',
        ])->assertStatus(200);

        $this->assertEquals('completed', $term1->fresh()->status);
        $this->assertEquals('active', $term2->fresh()->status);
    }

    public function test_admin_can_delete_inactive_school_year(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $sy = SchoolYear::create([
            'name' => '2099-2100',
            'start_date' => '2099-06-01',
            'end_date' => '2100-03-31',
            'is_active' => false,
        ]);
        $sy->terms()->create(['term_number' => 1, 'name' => 'First Term', 'status' => 'pending']);

        $response = $this->actingAs($admin)->deleteJson("/api/school-years/{$sy->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('school_years', ['id' => $sy->id]);
    }
}
