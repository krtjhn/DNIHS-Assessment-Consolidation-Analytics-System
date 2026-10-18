<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class TeacherAccountTest extends TestCase
{
    use DatabaseTransactions;

    public function test_teacher_registration_creates_pending_account_with_no_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Professor Armando Ramos',
            'email' => 'armando.ramos@gmail.com',
            'password' => 'FacultySecret123',
            'password_confirmation' => 'FacultySecret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('requires_approval', true)
            ->assertJsonMissing(['access_token']);

        $user = User::where('email', 'armando.ramos@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('pending', $user->approval_status);
        $this->assertFalse($user->is_active);
        $this->assertTrue($user->hasRole('teacher'));
    }

    public function test_pending_teacher_cannot_log_in(): void
    {
        $user = User::create([
            'name' => 'Pending Teacher',
            'email' => 'pending.teacher@gmail.com',
            'password' => bcrypt('password123'),
            'is_active' => false,
            'approval_status' => 'pending',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'pending.teacher@gmail.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Your account registration is currently pending administrator approval. Please wait for an administrator to activate your account.');
    }

    public function test_admin_can_view_teachers_list_including_pending_and_inactive(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        User::create([
            'name' => 'Applicant Teacher',
            'email' => 'applicant@gmail.com',
            'password' => bcrypt('password123'),
            'is_active' => false,
            'approval_status' => 'pending',
        ])->roles()->attach(Role::where('name', 'teacher')->first()->id);

        $response = $this->actingAs($admin)->getJson('/api/teachers?include_inactive=1');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'name', 'email', 'is_active', 'approval_status']]]);

        $emails = collect($response->json('data'))->pluck('email');
        $this->assertTrue($emails->contains('applicant@gmail.com'));
    }

    public function test_admin_can_approve_pending_teacher_enabling_login(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        $applicant = User::create([
            'name' => 'New Approved Teacher',
            'email' => 'approved.applicant@gmail.com',
            'password' => bcrypt('password123'),
            'is_active' => false,
            'approval_status' => 'pending',
        ]);
        $applicant->roles()->attach(Role::where('name', 'teacher')->first()->id);

        $response = $this->actingAs($admin)->patchJson("/api/teachers/{$applicant->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('data.approval_status', 'approved')
            ->assertJsonPath('data.is_active', true);

        $applicant->refresh();
        $this->assertEquals('approved', $applicant->approval_status);
        $this->assertTrue($applicant->is_active);
        $this->assertNotNull($applicant->approved_at);

        // Teacher can now log in
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'approved.applicant@gmail.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['access_token', 'user']);
    }

    public function test_admin_can_reject_pending_teacher(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        $applicant = User::create([
            'name' => 'Rejected Teacher',
            'email' => 'rejected.applicant@gmail.com',
            'password' => bcrypt('password123'),
            'is_active' => false,
            'approval_status' => 'pending',
        ]);
        $applicant->roles()->attach(Role::where('name', 'teacher')->first()->id);

        $response = $this->actingAs($admin)->patchJson("/api/teachers/{$applicant->id}/reject");

        $response->assertStatus(200)
            ->assertJsonPath('data.approval_status', 'rejected');

        $applicant->refresh();
        $this->assertEquals('rejected', $applicant->approval_status);
        $this->assertFalse($applicant->is_active);

        // Login fails with rejected status
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'rejected.applicant@gmail.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(403)
            ->assertJsonPath('message', 'Your account registration was not approved. Please contact the school administrator.');
    }

    public function test_admin_can_provision_teacher_directly(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        $response = $this->actingAs($admin)->postJson('/api/teachers', [
            'name' => 'Directly Provisioned Teacher',
            'email' => 'direct.teacher@gmail.com',
            'password' => 'ProvisionSecret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Directly Provisioned Teacher')
            ->assertJsonPath('data.approval_status', 'approved')
            ->assertJsonPath('data.is_active', true);

        $created = User::where('email', 'direct.teacher@gmail.com')->first();
        $this->assertNotNull($created);
        $this->assertTrue($created->is_active);
        $this->assertEquals('approved', $created->approval_status);
        $this->assertTrue($created->hasRole('teacher'));
    }

    public function test_admin_can_soft_revoke_and_reactivate_teacher(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();

        // 1. Soft revoke
        $response1 = $this->actingAs($admin)->deleteJson("/api/teachers/{$teacher->id}");
        $response1->assertStatus(200);

        $teacher->refresh();
        $this->assertFalse($teacher->is_active);

        // 2. Reactivate
        $response2 = $this->actingAs($admin)->patchJson("/api/teachers/{$teacher->id}/reactivate");
        $response2->assertStatus(200);

        $teacher->refresh();
        $this->assertTrue($teacher->is_active);
        $this->assertEquals('approved', $teacher->approval_status);
    }

    public function test_admin_cannot_revoke_administrator_account(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        $response = $this->actingAs($admin)->deleteJson("/api/teachers/{$admin->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Only teacher accounts without administrator access can be removed.');
    }

    public function test_non_admin_cannot_manage_teachers(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();

        $response = $this->actingAs($teacher)->getJson('/api/teachers');
        $response->assertStatus(403);

        $responsePost = $this->actingAs($teacher)->postJson('/api/teachers', [
            'name' => 'Hacker Teacher',
            'email' => 'hacker@gmail.com',
            'password' => 'secret123',
        ]);
        $responsePost->assertStatus(403);
    }
}
