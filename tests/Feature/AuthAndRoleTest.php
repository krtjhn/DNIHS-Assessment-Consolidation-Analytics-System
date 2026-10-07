<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AuthAndRoleTest extends TestCase
{
    /**
     * + Test registration creates a user with 'teacher' role.
     */
    public function test_user_can_register_as_teacher(): void
    {
        $uniqueEmail = 'bagong.guro_' . uniqid() . '@dayapnhs.edu.ph';

        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Bagong Guro',
            'email'                 => $uniqueEmail,
            'password'              => 'Password@123',
            'password_confirmation' => 'Password@123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['access_token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('users', ['email' => $uniqueEmail]);
    }

    /**
     * + Test login issues a Sanctum token.
     */
    public function test_user_can_login_with_correct_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'admin@dayapnhs.edu.ph',
            'password' => 'Admin@2024!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token', 'user']);
    }

    /**
     * + Test route protection: Teachers cannot create sections.
     */
    public function test_teacher_cannot_create_section(): void
    {
        $teacher = User::where('email', 'maria.santos@dayapnhs.edu.ph')->first();

        $response = $this->actingAs($teacher)
            ->postJson('/api/sections', [
                'school_year_id' => 1,
                'grade_level_id' => 1,
                'name'           => 'Section Mabini',
            ]);

        $response->assertStatus(403); // Forbidden para sa teacher
    }
}