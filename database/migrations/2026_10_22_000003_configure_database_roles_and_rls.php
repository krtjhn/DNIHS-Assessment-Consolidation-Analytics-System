<?php

use Illuminate\Database\Migrations\Migration; // Base migration class
use Illuminate\Support\Facades\DB; // Database query and raw statement facade
use Illuminate\Support\Facades\Schema; // Database schema builder facade

return new class extends Migration // Anonymous migration definition
{
    // Run the migrations to remediate security findings, configure database roles, and enforce RLS across tables
    public function up(): void
    {
        // Execute PostgreSQL-specific security commands only if the active driver is pgsql
        if (DB::getDriverName() === 'pgsql') {
            // 1. Create custom database group roles idempotently if they do not already exist
            DB::unprepared("
                DO \$\$
                BEGIN
                    -- Check system catalog and create administrator group role with NOLOGIN
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dnihs_admin_role') THEN
                        CREATE ROLE dnihs_admin_role NOLOGIN; -- Administrator role template
                    END IF;
                    -- Check system catalog and create teacher faculty staff role with NOLOGIN
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dnihs_teacher_staff') THEN
                        CREATE ROLE dnihs_teacher_staff NOLOGIN; -- Restricted teacher role template
                    END IF;
                END
                \$\$;
            ");

            // 2. Fix mutable search_path warnings on functions to prevent Trojan-horse schema hijacking (CVE-2018-1058 defense)
            DB::unprepared('
                ALTER FUNCTION fn_calculate_assessment_metrics() SET search_path = public, pg_temp; -- Restrict calculation trigger to public schema
                ALTER FUNCTION fn_audit_assessment_records() SET search_path = public, pg_temp; -- Restrict audit logging trigger to public schema
            ');

            // 3. Grant schema usage and assign role privileges under the Principle of Least Privilege
            DB::unprepared('
                -- Allow both roles to look up and reference objects within the public schema
                GRANT USAGE ON SCHEMA public TO dnihs_admin_role, dnihs_teacher_staff;
                -- Grant full table access (SELECT, INSERT, UPDATE, DELETE, TRUNCATE) to administrator role
                GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dnihs_admin_role;
                -- Grant full auto-increment sequence access to administrator role
                GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dnihs_admin_role;

                -- Least-privilege grants: allow teacher staff read-only access on reference tables
                GRANT SELECT ON grade_levels, school_years, terms, sections, subjects, users, teaching_assignments TO dnihs_teacher_staff;
                -- Least-privilege grants: allow teachers to view, encode, and correct grades with strictly NO DELETE privilege
                GRANT SELECT, INSERT, UPDATE ON assessment_records TO dnihs_teacher_staff;
                -- Grant sequence lookup and usage so teacher insertions can generate auto-incrementing primary keys
                GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dnihs_teacher_staff;
            ');

            // 4. List of all public schema tables required to enforce Row-Level Security (RLS)
            $tables = [
                'users', // Application users and authentication records
                'roles', // Role definitions (system_admin, teacher)
                'role_user', // Pivot table linking users and roles
                'grade_levels', // Academic grade levels (Grade 7 to 10)
                'school_years', // Academic school years
                'terms', // Grading terms and quarters
                'sections', // Classroom sections
                'subjects', // Curriculum learning areas
                'teaching_assignments', // Teacher-section-subject assignments
                'assessment_records', // Core assessment score sheets and metrics
                'assessment_audit_logs', // Forensic score adjustment audit history
                'personal_access_tokens', // Laravel Sanctum API tokens
                'password_reset_tokens', // Password reset tokens
                'sessions', // Web user session state
                'jobs', // Asynchronous background job queue
                'job_batches', // Batch job tracking records
                'failed_jobs', // Failed queue job records
                'cache', // Application performance cache table
                'cache_locks', // Distributed cache locks
                'migrations', // Database migration history tracker
            ];

            // 5. Enable Row-Level Security (RLS) on every public table to satisfy security auditing
            foreach ($tables as $table) {
                // Ensure table exists before executing DDL command
                if (Schema::hasTable($table)) {
                    DB::unprepared("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;"); // Enforce row-level security policy checks
                }
            }

            // 6. Define strict, role-aligned RLS policies for assessment_records (Eliminates rls_policy_always_true warning)
            DB::unprepared('
                -- Drop previous policies to ensure clean and conflict-free policy registration
                DROP POLICY IF EXISTS p_assessment_app_service ON assessment_records; -- Drop legacy service policy
                DROP POLICY IF EXISTS p_assessment_admin_all ON assessment_records; -- Drop existing admin policy
                DROP POLICY IF EXISTS p_assessment_teacher_select ON assessment_records; -- Drop existing teacher select policy
                DROP POLICY IF EXISTS p_assessment_teacher_insert ON assessment_records; -- Drop existing teacher insert policy
                DROP POLICY IF EXISTS p_assessment_teacher_update ON assessment_records; -- Drop existing teacher update policy

                -- Policy for dnihs_admin_role: Unrestricted full CRUD access across all assessment records
                CREATE POLICY p_assessment_admin_all 
                ON assessment_records 
                FOR ALL 
                TO dnihs_admin_role 
                USING (true) -- Admin can target and read all rows
                WITH CHECK (true); -- Admin can write and modify all rows

                -- Policy for dnihs_teacher_staff: Allow viewing of active non-deleted assessment records only
                CREATE POLICY p_assessment_teacher_select 
                ON assessment_records 
                FOR SELECT 
                TO dnihs_teacher_staff 
                USING (deleted_at IS NULL); -- Filter out soft-deleted and archived records at database engine level

                -- Policy for dnihs_teacher_staff: Ensure newly inserted records are active
                CREATE POLICY p_assessment_teacher_insert 
                ON assessment_records 
                FOR INSERT 
                TO dnihs_teacher_staff 
                WITH CHECK (deleted_at IS NULL); -- Prevent teachers from inserting pre-deleted records

                -- Policy for dnihs_teacher_staff: Allow updates exclusively on active records and prevent soft-delete tampering
                CREATE POLICY p_assessment_teacher_update 
                ON assessment_records 
                FOR UPDATE 
                TO dnihs_teacher_staff 
                USING (deleted_at IS NULL) -- Target active records only
                WITH CHECK (deleted_at IS NULL); -- Prevent teachers from altering deleted_at timestamp
            ');
        }
    }

    // Reverse the migrations and restore database to previous state
    public function down(): void
    {
        // Execute rollback logic only when running on PostgreSQL engine
        if (DB::getDriverName() === 'pgsql') {
            // 1. Remove all configured Row-Level Security policies from assessment_records
            DB::unprepared('
                DROP POLICY IF EXISTS p_assessment_teacher_update ON assessment_records; -- Remove teacher update policy
                DROP POLICY IF EXISTS p_assessment_teacher_insert ON assessment_records; -- Remove teacher insert policy
                DROP POLICY IF EXISTS p_assessment_teacher_select ON assessment_records; -- Remove teacher select policy
                DROP POLICY IF EXISTS p_assessment_admin_all ON assessment_records; -- Remove admin full access policy
            ');

            // 2. List of tables to disable Row-Level Security
            $tables = [
                'users', 'roles', 'role_user', 'grade_levels', 'school_years',
                'terms', 'sections', 'subjects', 'teaching_assignments',
                'assessment_records', 'assessment_audit_logs', 'personal_access_tokens',
                'password_reset_tokens', 'sessions', 'jobs', 'job_batches',
                'failed_jobs', 'cache', 'cache_locks', 'migrations',
            ];

            // 3. Disable Row-Level Security on every public table
            foreach ($tables as $table) {
                // Ensure table exists prior to running DDL statement
                if (Schema::hasTable($table)) {
                    DB::unprepared("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY;"); // Disable row-level security checks
                }
            }

            // 4. Revoke schema and object privileges and remove custom database roles
            DB::unprepared('
                REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM dnihs_admin_role, dnihs_teacher_staff; -- Revoke table privileges
                REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM dnihs_admin_role, dnihs_teacher_staff; -- Revoke sequence privileges
                REVOKE USAGE ON SCHEMA public FROM dnihs_admin_role, dnihs_teacher_staff; -- Revoke schema access
                DROP ROLE IF EXISTS dnihs_teacher_staff; -- Remove teacher staff database role
                DROP ROLE IF EXISTS dnihs_admin_role; -- Remove administrator database role
            ');
        }
    }
};
