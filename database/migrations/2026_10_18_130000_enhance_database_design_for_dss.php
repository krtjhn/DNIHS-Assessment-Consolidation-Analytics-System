<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to harden database design for Decision Support System (DSS)
     * multi-year analytics, substitute teacher support, and strict historical data retention.
     */
    public function up(): void
    {
        // 1. Add 'code' to subjects table for standard curriculum indexing (NO redundant department)
        Schema::table('subjects', function (Blueprint $table): void {
            if (! Schema::hasColumn('subjects', 'code')) {
                $table->string('code')->nullable()->after('name');
            }
            if (Schema::hasColumn('subjects', 'department')) {
                $table->dropColumn('department');
            }
        });

        // 1.1 Backfill code for existing subjects
        $gradeLevels = DB::table('grade_levels')->pluck('level', 'id');
        $subjects = DB::table('subjects')->get();

        $codeMap = [
            'Filipino' => 'FIL',
            'English' => 'ENG',
            'Mathematics' => 'MATH',
            'Science' => 'SCI',
            'Araling Panlipunan' => 'AP',
            'TLE' => 'TLE',
            'MAPEH' => 'MAPEH',
            'Values Education' => 'ESP',
            'Edukasyon sa Pagpapakatao' => 'ESP',
        ];

        foreach ($subjects as $subj) {
            $level = $gradeLevels[$subj->grade_level_id] ?? '7';
            $basePrefix = $codeMap[$subj->name] ?? strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $subj->name), 0, 4));
            $code = "{$basePrefix}-{$level}";

            DB::table('subjects')->where('id', $subj->id)->update([
                'code' => $code,
            ]);
        }

        // 2. Add SoftDeletes to users, sections, school_years, and assessment_records
        if (! Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('sections', 'deleted_at')) {
            Schema::table('sections', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('school_years', 'deleted_at')) {
            Schema::table('school_years', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('assessment_records', 'deleted_at')) {
            Schema::table('assessment_records', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        // 3. Teaching Assignments: Partial Unique Index allowing mid-year substitute teachers
        // Drops old non-partial constraints if they exist
        try {
            DB::statement('ALTER TABLE teaching_assignments DROP CONSTRAINT IF EXISTS teaching_assignments_sy_sec_subj_unique;');
        } catch (\Throwable $e) {}

        try {
            DB::statement('ALTER TABLE teaching_assignments DROP CONSTRAINT IF EXISTS teaching_assignments_sy_sec_subj_user_unique;');
        } catch (\Throwable $e) {}

        DB::statement('DROP INDEX IF EXISTS teaching_assignments_sy_sec_subj_active_unique;');
        DB::statement('CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique ON teaching_assignments (school_year_id, section_id, subject_id) WHERE effective_until IS NULL;');

        // 4. Harden assessment_records: change teacher_id constraint from CASCADE to RESTRICT
        try {
            Schema::table('assessment_records', function (Blueprint $table): void {
                $table->dropForeign(['teacher_id']);
                $table->foreign('teacher_id')
                    ->references('id')
                    ->on('users')
                    ->restrictOnDelete();
            });
        } catch (\Throwable $e) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 4. Revert assessment_records teacher_id foreign key
        try {
            Schema::table('assessment_records', function (Blueprint $table): void {
                $table->dropForeign(['teacher_id']);
                $table->foreign('teacher_id')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete();
                $table->dropSoftDeletes();
            });
        } catch (\Throwable $e) {}

        // 3. Revert teaching_assignments unique index
        DB::statement('DROP INDEX IF EXISTS teaching_assignments_sy_sec_subj_active_unique;');

        // 2. Drop SoftDeletes
        Schema::table('school_years', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });

        Schema::table('sections', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });

        // 1. Drop subjects code
        Schema::table('subjects', function (Blueprint $table): void {
            $table->dropColumn('code');
        });
    }
};
