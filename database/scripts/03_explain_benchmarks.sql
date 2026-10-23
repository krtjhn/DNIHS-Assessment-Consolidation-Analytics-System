-- =====================================================================
-- DepEd DNIHS DSS - PostgreSQL EXPLAIN ANALYZE Performance Benchmarks
-- Evaluates execution plans, scan types, cost models, and buffer usage
-- =====================================================================

-- ---------------------------------------------------------------------
-- BENCHMARK 1: Assessment Records Consolidation Query
-- Table: assessment_records
-- Target Index: assess_records_consolidation_idx (school_year_id, term_id, type, grade_level_id)
-- ---------------------------------------------------------------------

-- Plan A: Without Index (Sequential Scan Simulation)
BEGIN;
SET LOCAL enable_indexscan = off;
SET LOCAL enable_bitmapscan = off;
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT 
    id, school_year_id, term_id, grade_level_id, section_id, subject_id, 
    type, total_items, mean, mps, sd, remarks
FROM assessment_records
WHERE school_year_id = 1 
  AND term_id = 1 
  AND type = 'Quarterly'
  AND grade_level_id = 1
  AND deleted_at IS NULL;
COMMIT;

-- Plan B: With Composite Index (Bitmap Index Scan / Index Scan)
BEGIN;
SET LOCAL enable_indexscan = on;
SET LOCAL enable_bitmapscan = on;
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT 
    id, school_year_id, term_id, grade_level_id, section_id, subject_id, 
    type, total_items, mean, mps, sd, remarks
FROM assessment_records
WHERE school_year_id = 1 
  AND term_id = 1 
  AND type = 'Quarterly'
  AND grade_level_id = 1
  AND deleted_at IS NULL;
COMMIT;


-- ---------------------------------------------------------------------
-- BENCHMARK 2: Active Substitute & Section Assignment Query
-- Table: teaching_assignments
-- Target Index: teaching_assignments_sy_sec_subj_active_unique (school_year_id, section_id, subject_id WHERE effective_until IS NULL)
-- ---------------------------------------------------------------------

-- Plan A: Sequential Scan
BEGIN;
SET LOCAL enable_indexscan = off;
SET LOCAL enable_bitmapscan = off;
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT id, user_id, school_year_id, section_id, subject_id, effective_from
FROM teaching_assignments
WHERE school_year_id = 1 
  AND section_id = 1 
  AND subject_id = 1 
  AND effective_until IS NULL;
COMMIT;

-- Plan B: Index Scan on Partial Unique Index
BEGIN;
SET LOCAL enable_indexscan = on;
SET LOCAL enable_bitmapscan = on;
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT id, user_id, school_year_id, section_id, subject_id, effective_from
FROM teaching_assignments
WHERE school_year_id = 1 
  AND section_id = 1 
  AND subject_id = 1 
  AND effective_until IS NULL;
COMMIT;


-- ---------------------------------------------------------------------
-- BENCHMARK 3: Faculty Approval Status Filtering
-- Table: users
-- Target Index: users_approval_status_idx (approval_status)
-- ---------------------------------------------------------------------

EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT id, name, email, approval_status, created_at
FROM users
WHERE approval_status = 'pending'
  AND deleted_at IS NULL;
