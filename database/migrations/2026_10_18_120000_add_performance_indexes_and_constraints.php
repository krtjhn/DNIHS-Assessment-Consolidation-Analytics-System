<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Run the migrations to apply audited performance indexes and integrity constraints
    public function up(): void
    {
        // 1. Index on users.approval_status for fast teacher approval querying
        Schema::table('users', function (Blueprint $table): void {
            $table->index('approval_status', 'users_approval_status_idx');
        });

        // 2. Index on school_years.is_active for fast active academic year lookups
        Schema::table('school_years', function (Blueprint $table): void {
            $table->index('is_active', 'school_years_is_active_idx');
        });

        // 3. Index on sections.grade_level_id for fast section lookups by grade
        Schema::table('sections', function (Blueprint $table): void {
            $table->index('grade_level_id', 'sections_grade_level_id_idx');
        });

        // 4. Duplicate prevention on teaching assignments
        Schema::table('teaching_assignments', function (Blueprint $table): void {
            $table->unique(
                ['school_year_id', 'section_id', 'subject_id', 'user_id'],
                'teaching_assignments_sy_sec_subj_user_unique'
            );
        });

        // 5. Composite index for high-speed consolidation reporting (pooled variance)
        Schema::table('assessment_records', function (Blueprint $table): void {
            $table->index(
                ['school_year_id', 'term_id', 'type', 'grade_level_id'],
                'assess_records_consolidation_idx'
            );
        });
    }

    // Reverse the migrations
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS assess_records_consolidation_idx;');
            DB::statement('ALTER TABLE teaching_assignments DROP CONSTRAINT IF EXISTS teaching_assignments_sy_sec_subj_user_unique;');
            DB::statement('DROP INDEX IF EXISTS sections_grade_level_id_idx;');
            DB::statement('DROP INDEX IF EXISTS school_years_is_active_idx;');
            DB::statement('DROP INDEX IF EXISTS users_approval_status_idx;');
        } else {
            Schema::table('assessment_records', function (Blueprint $table): void {
                try {
                    $table->dropIndex('assess_records_consolidation_idx');
                } catch (Throwable $e) {
                }
            });

            Schema::table('teaching_assignments', function (Blueprint $table): void {
                try {
                    $table->dropUnique('teaching_assignments_sy_sec_subj_user_unique');
                } catch (Throwable $e) {
                }
            });

            Schema::table('sections', function (Blueprint $table): void {
                try {
                    $table->dropIndex('sections_grade_level_id_idx');
                } catch (Throwable $e) {
                }
            });

            Schema::table('school_years', function (Blueprint $table): void {
                try {
                    $table->dropIndex('school_years_is_active_idx');
                } catch (Throwable $e) {
                }
            });

            Schema::table('users', function (Blueprint $table): void {
                try {
                    $table->dropIndex('users_approval_status_idx');
                } catch (Throwable $e) {
                }
            });
        }
    }
};
