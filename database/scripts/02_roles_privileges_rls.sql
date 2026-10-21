-- DNIHS Assessment Consolidation & Analytics System
-- Phase 45: Database Roles, Privileges, and Row-Level Security (RLS)
-- Remediates Supabase Security Linter findings and satisfies Rubric Criteria 2 & 3

-- 1. Create Custom Roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dnihs_admin_role') THEN
        CREATE ROLE dnihs_admin_role NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dnihs_teacher_staff') THEN
        CREATE ROLE dnihs_teacher_staff NOLOGIN;
    END IF;
END
$$;

-- 2. Secure Function search_path (CVE Mitigation)
ALTER FUNCTION fn_calculate_assessment_metrics() SET search_path = public, pg_temp;
ALTER FUNCTION fn_audit_assessment_records() SET search_path = public, pg_temp;

-- 3. Grant Schema Usage and Assign Privileges
GRANT USAGE ON SCHEMA public TO dnihs_admin_role, dnihs_teacher_staff;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dnihs_admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dnihs_admin_role;

-- Least-Privilege Grants for Teacher Staff (Strictly NO DELETE)
GRANT SELECT ON grade_levels, school_years, terms, sections, subjects, users, teaching_assignments TO dnihs_teacher_staff;
GRANT SELECT, INSERT, UPDATE ON assessment_records TO dnihs_teacher_staff;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dnihs_teacher_staff;

-- 4. Enforce Row-Level Security (RLS) on all public tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;

-- 5. Define Role-Aligned RLS Policies for assessment_records
DROP POLICY IF EXISTS p_assessment_app_service ON assessment_records;
DROP POLICY IF EXISTS p_assessment_admin_all ON assessment_records;
DROP POLICY IF EXISTS p_assessment_teacher_select ON assessment_records;
DROP POLICY IF EXISTS p_assessment_teacher_insert ON assessment_records;
DROP POLICY IF EXISTS p_assessment_teacher_update ON assessment_records;

CREATE POLICY p_assessment_admin_all 
ON assessment_records 
FOR ALL 
TO dnihs_admin_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY p_assessment_teacher_select 
ON assessment_records 
FOR SELECT 
TO dnihs_teacher_staff 
USING (deleted_at IS NULL);

CREATE POLICY p_assessment_teacher_insert 
ON assessment_records 
FOR INSERT 
TO dnihs_teacher_staff 
WITH CHECK (deleted_at IS NULL);

CREATE POLICY p_assessment_teacher_update 
ON assessment_records 
FOR UPDATE 
TO dnihs_teacher_staff 
USING (deleted_at IS NULL) 
WITH CHECK (deleted_at IS NULL);
