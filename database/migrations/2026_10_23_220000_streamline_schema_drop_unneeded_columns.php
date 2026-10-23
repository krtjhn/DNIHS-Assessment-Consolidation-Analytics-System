<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Apply schema streamlining: drop email_verified_at and remove updated_at from role_user
    public function up(): void
    {
        // 1. Drop email_verified_at from users table (authentication relies strictly on approval_status)
        if (Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('email_verified_at');
            });
        }

        // 2. Drop updated_at from role_user pivot table (pure relational role assignment link)
        if (Schema::hasColumn('role_user', 'updated_at')) {
            Schema::table('role_user', function (Blueprint $table) {
                $table->dropColumn('updated_at');
            });
        }

        // 3. Ensure role_user.created_at defaults to CURRENT_TIMESTAMP in PostgreSQL
        DB::statement('ALTER TABLE role_user ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;');
    }

    // Reverse schema streamlining
    public function down(): void
    {
        if (! Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('email_verified_at')->nullable();
            });
        }

        if (! Schema::hasColumn('role_user', 'updated_at')) {
            Schema::table('role_user', function (Blueprint $table) {
                $table->timestamp('updated_at')->nullable();
            });
        }
    }
};
