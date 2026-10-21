<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Run the migrations to remediate all Supabase security linter findings and enforce RLS across all tables
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // 1. Create custom database roles if they do not exist
            DB::unprepared("
                DO \$\$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dnihs_admin_role') THEN
                        CREATE ROLE dnihs_admin_role NOLOGIN;
                    END IF;
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dnihs_teacher_staff') THEN
                        CREATE ROLE dnihs_teacher_staff NOLOGIN;
                    END IF;
                END
                \$\$;
            ");

            // 2. Fix mutable search_path warnings on functions (CVE defense)
            DB::unprepared("
                ALTER FUNCTION fn_calculate_assessment_metrics() SET search_path = public, pg_temp;
                ALTER FUNCTION fn_audit_assessment_records() SET search_path = public, pg_temp;
            ");

            // 3. Grant schema usage and assign role privileges
            DB::unprepared("
                GRANT USAGE ON SCHEMA public TO dnihs_admin_role, dnihs_teacher_staff;
                GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dnihs_admin_role;
                GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dnihs_admin_role;

                -- Least-privilege grants for teacher staff
                GRANT SELECT ON grade_levels, school_years, terms, sections, subjects, users, teaching_assignments TO dnihs_teacher_staff;
                GRANT SELECT, INSERT, UPDATE ON assessment_records TO dnihs_teacher_staff;
                GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dnihs_teacher_staff;
            ");

            // 4. List of all public tables to enforce Row-Level Security (RLS)
            $tables = [
                'users',
                'roles',
                'role_user',
                'grade_levels',
                'school_years',
                'terms',
                'sections',
                'subjects',
                'teaching_assignments',
                'assessment_records',
                'assessment_audit_logs',
                'personal_access_tokens',
                'password_reset_tokens',
                'sessions',
                'jobs',
                'job_batches',
                'failed_jobs',
                'cache',
                'cache_locks',
                'migrations',
            ];

            // 5. Enable RLS on every public table to satisfy security audit
            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::unprepared("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;");
                }
            }

            // 6. Define strict, role-aligned RLS policies for assessment_records (Eliminates rls_policy_always_true warning)
            DB::unprepared("
                -- Drop previous overly permissive policy if existing
                DROP POLICY IF EXISTS p_assessment_app_service ON assessment_records;
                DROP POLICY IF EXISTS p_assessment_admin_all ON assessment_records;
                DROP POLICY IF EXISTS p_assessment_teacher_select ON assessment_records;
                DROP POLICY IF EXISTS p_assessment_teacher_insert ON assessment_records;
                DROP POLICY IF EXISTS p_assessment_teacher_update ON assessment_records;

                -- Policy for dnihs_admin_role: Full access
                CREATE POLICY p_assessment_admin_all 
                ON assessment_records 
                FOR ALL 
                TO dnihs_admin_role 
                USING (true) 
                WITH CHECK (true);

                -- Policy for dnihs_teacher_staff: View active records
                CREATE POLICY p_assessment_teacher_select 
                ON assessment_records 
                FOR SELECT 
                TO dnihs_teacher_staff 
                USING (deleted_at IS NULL);

                -- Policy for dnihs_teacher_staff: Insert active records
                CREATE POLICY p_assessment_teacher_insert 
                ON assessment_records 
                FOR INSERT 
                TO dnihs_teacher_staff 
                WITH CHECK (deleted_at IS NULL);

                -- Policy for dnihs_teacher_staff: Update active records
                CREATE POLICY p_assessment_teacher_update 
                ON assessment_records 
                FOR UPDATE 
                TO dnihs_teacher_staff 
                USING (deleted_at IS NULL) 
                WITH CHECK (deleted_at IS NULL);
            ");
        }
    }

    // Reverse the migrations
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared("
                DROP POLICY IF EXISTS p_assessment_teacher_update ON assessment_records;
                DROP POLICY IF EXISTS p_assessment_teacher_insert ON assessment_records;
                DROP POLICY IF EXISTS p_assessment_teacher_select ON assessment_records;
                DROP POLICY IF EXISTS p_assessment_admin_all ON assessment_records;
            ");

            $tables = [
                'users', 'roles', 'role_user', 'grade_levels', 'school_years',
                'terms', 'sections', 'subjects', 'teaching_assignments',
                'assessment_records', 'assessment_audit_logs', 'personal_access_tokens',
                'password_reset_tokens', 'sessions', 'jobs', 'job_batches',
                'failed_jobs', 'cache', 'cache_locks', 'migrations',
            ];

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::unprepared("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY;");
                }
            }

            DB::unprepared("
                REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM dnihs_admin_role, dnihs_teacher_staff;
                REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM dnihs_admin_role, dnihs_teacher_staff;
                REVOKE USAGE ON SCHEMA public FROM dnihs_admin_role, dnihs_teacher_staff;
                DROP ROLE IF EXISTS dnihs_teacher_staff;
                DROP ROLE IF EXISTS dnihs_admin_role;
            ");
        }
    }
};
