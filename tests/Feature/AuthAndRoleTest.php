<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AuthAndRoleTest extends TestCase
{
    use DatabaseTransactions;

    // Test registration creates a user with pending approval status and teacher role
    public function test_user_can_register_as_teacher(): void
    {
        $uniqueEmail = 'applicant.teacher_'.uniqid().'@gmail.com';

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Applicant Teacher',
            'email' => $uniqueEmail,
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('requires_approval', true)
            ->assertJsonStructure(['message', 'user' => ['id', 'name', 'email', 'approval_status']]);

        $this->assertDatabaseHas('users', [
            'email' => $uniqueEmail,
            'approval_status' => 'pending',
            'is_active' => false,
        ]);
    }

    // Test valid credentials authentication returns Sanctum bearer token
    public function test_user_can_login_with_correct_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@gmail.com',
            'password' => 'Admin@2024!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token', 'user']);
    }

    // Test RBAC protection prevents teachers from creating sections
    public function test_teacher_cannot_create_section(): void
    {
        $teacher = User::where('email', 'maria.santos@gmail.com')->first();

        $response = $this->actingAs($teacher)
            ->postJson('/api/sections', [
                'school_year_id' => 1,
                'grade_level_id' => 1,
                'name' => 'Section Mabini',
            ]);

        $response->assertStatus(403);
    }

    // Test registration rejects invalid format email addresses
    public function test_registration_requires_valid_email_format(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Invalid Email Teacher',
            'email' => 'not-a-valid-email',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // Test login rejects invalid format email addresses
    public function test_login_requires_valid_email_format(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'not-a-valid-email',
            'password' => 'Admin@2024!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // Test user can login, logout, and login again with newly issued token
    public function test_user_can_login_logout_and_login_again(): void
    {
        // 1. Initial login
        $login1 = $this->postJson('/api/auth/login', [
            'email' => 'admin@gmail.com',
            'password' => 'Admin@2024!',
        ]);
        $login1->assertStatus(200);
        $token1 = $login1->json('access_token');
        $this->assertNotEmpty($token1);

        // 2. Count tokens
        $user = User::where('email', 'admin@gmail.com')->first();
        $initialTokens = $user->tokens()->count();
        $this->assertGreaterThan(0, $initialTokens);

        // 3. Logout
        $logout = $this->withHeader('Authorization', "Bearer {$token1}")
            ->postJson('/api/auth/logout', []);
        $logout->assertStatus(200);

        // 4. Token count should be reduced
        $afterLogoutTokens = $user->tokens()->count();
        $this->assertEquals($initialTokens - 1, $afterLogoutTokens);

        // 5. Login again
        $login2 = $this->postJson('/api/auth/login', [
            'email' => 'admin@gmail.com',
            'password' => 'Admin@2024!',
        ]);
        $login2->assertStatus(200);
        $token2 = $login2->json('access_token');

        // 6. Access reference data and sections with token2
        $ref2 = $this->withHeader('Authorization', "Bearer {$token2}")
            ->getJson('/api/reference-data');
        $ref2->assertStatus(200);
    }
}
