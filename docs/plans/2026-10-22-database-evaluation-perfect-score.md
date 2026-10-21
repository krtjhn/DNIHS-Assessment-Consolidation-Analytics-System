# Database Architecture, Administration & Rubric Compliance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate the database backend, administration scripts, schema integrity, and defense documentation to guarantee a 100% Perfect Score (70/70 Group Output) against the Capstone Database Evaluation Rubric.

**Architecture:** 
Implement PostgreSQL-native stored procedures, functions, and triggers for metric calculations and audit tracking; establish strict PostgreSQL database roles (`dnihs_admin`, `dnihs_teacher_staff`) and Row-Level Security (RLS) policies; benchmark query plans with `EXPLAIN (ANALYZE, BUFFERS)` on composite indexes; create automated backup and restore commands with verifiable restoration routines; and package everything with an ERD and defense master guide.

**Tech Stack:**
- PostgreSQL 17.11 (Supabase Cloud + local pg_dump/psql client 18.0)
- Laravel 11.x (PHP 8.2+, Eloquent ORM, Artisan CLI)
- PL/pgSQL (Procedural Language for Triggers & Functions)
- PowerShell 7 / Bash shell scripts for administration
- Mermaid.js for Entity-Relationship Diagrams (ERD)

---

### Task 1: Comprehensive Rubric Audit & Baseline Verification

**Files:**
- Create: `database/scripts/00_verify_baseline.sql`
- Inspect: `config/database.php`
- Inspect: `.env`

**Step 1: Write baseline verification SQL script**
Write `database/scripts/00_verify_baseline.sql` checking all existing tables, foreign keys, indexes, and PostgreSQL version.

**Step 2: Run verification script via artisan or tinker**
Run: `php artisan tinker --execute="DB::select('SELECT version();')"`
Expected: Output showing PostgreSQL 17.x / 18.x connected.

**Step 3: Document current rubric score vs target score**
Document gap analysis:
- Normalization & Keys: 95% -> Target 100% (Add ERD & Formal Proof)
- Indexes & EXPLAIN: 75% -> Target 100% (Run & document real EXPLAIN ANALYZE)
- Function or Trigger: 0% -> Target 100% (Implement PL/pgSQL Function & Trigger)
- Roles & Privileges / RLS: 60% -> Target 100% (Implement DB-level roles & RLS)
- Backup & Restore: 0% -> Target 100% (Create and prove backup/restore scripts)
- Laravel Connection: 95% -> Target 100% (Verify configuration & document)

---

### Task 2: Implement Database Functions and Triggers (Rubric Deliverable)

**Files:**
- Create: `database/migrations/2026_10_22_000001_create_assessment_metrics_trigger_and_audit.php`
- Create: `database/scripts/01_functions_and_triggers.sql`
- Test: `tests/Feature/DatabaseTriggerTest.php`

**Step 1: Write failing feature test for database trigger**
Create `tests/Feature/DatabaseTriggerTest.php` asserting that when an assessment record is inserted with `total_items = 50` and `mean = 40.00`, the PostgreSQL trigger automatically sets `mps = 80.00` and assigns the appropriate DepEd mastery `remarks` even if omitted in the payload. Also assert audit record creation.

**Step 2: Run test to verify it fails**
Run: `php artisan test tests/Feature/DatabaseTriggerTest.php`
Expected: FAIL (Trigger does not exist yet).

**Step 3: Implement migration with PL/pgSQL functions and triggers**
Create migration `2026_10_22_000001_create_assessment_metrics_trigger_and_audit.php`:
1. `assessment_audit_logs` table: `id`, `assessment_id`, `action`, `old_mean`, `new_mean`, `old_mps`, `new_mps`, `changed_by_user_id`, `created_at`.
2. Stored Function `fn_calculate_assessment_metrics()`:
   - Validates `total_items > 0` and `mean <= total_items`.
   - Computes `NEW.mps = ROUND((NEW.mean / NEW.total_items) * 100.0, 2)`.
   - Auto-computes `NEW.remarks` if null:
     - MPS >= 75.00: `'Mastered'`
     - MPS >= 50.00: `'Nearly Mastered'`
     - MPS < 50.00: `'Low Mastery'`
3. Trigger `trg_assessment_records_before_insert_or_update`:
   - `BEFORE INSERT OR UPDATE ON assessment_records FOR EACH ROW EXECUTE FUNCTION fn_calculate_assessment_metrics();`
4. Stored Function & Trigger for audit logging:
   - `fn_audit_assessment_records()` logging updates/deletes to `assessment_audit_logs`.

**Step 4: Execute migration and run test**
Run: `php artisan migrate`
Run: `php artisan test tests/Feature/DatabaseTriggerTest.php`
Expected: PASS.

**Step 5: Commit changes**
Run:
```bash
git add database/migrations/*create_assessment_metrics_trigger* database/scripts/01_functions_and_triggers.sql tests/Feature/DatabaseTriggerTest.php
git commit -m "feat(database): implement PostgreSQL stored functions, triggers, and audit logging"
```

---

### Task 3: Implement Database Roles, Privileges & Row-Level Security (RLS)

**Files:**
- Create: `database/migrations/2026_10_22_000002_configure_database_roles_and_rls.php`
- Create: `database/scripts/02_roles_privileges_rls.sql`
- Test: `tests/Feature/DatabaseSecurityPolicyTest.php`

**Step 1: Write test verifying role permissions and RLS behavior**
Create `tests/Feature/DatabaseSecurityPolicyTest.php` testing role existence and RLS query policies.

**Step 2: Implement migration and SQL script for Roles & RLS**
1. Create roles if not existing:
   - `dnihs_admin_role`: Super administrator / DBA role with full DDL/DML privileges.
   - `dnihs_teacher_staff`: Standard staff role with restricted DML (SELECT on reference data, SELECT/INSERT/UPDATE on own assessments; NO DROP, NO ALTER, NO TRUNCATE).
2. Enable RLS:
   - `ALTER TABLE assessment_records ENABLE ROW LEVEL SECURITY;`
   - Define RLS policies:
     - `admin_full_access`: Allows admin role full CRUD access.
     - `authenticated_app_access`: Allows the application service account controlled CRUD access while respecting soft deletes (`deleted_at IS NULL`).

**Step 3: Run migration and test**
Run: `php artisan migrate`
Run: `php artisan test tests/Feature/DatabaseSecurityPolicyTest.php`
Expected: PASS.

**Step 4: Commit changes**
Run:
```bash
git add database/migrations/*roles* database/scripts/02_roles_privileges_rls.sql tests/Feature/DatabaseSecurityPolicyTest.php
git commit -m "feat(database): configure PostgreSQL roles, privileges, and RLS policies"
```

---

### Task 4: Execute and Document EXPLAIN ANALYZE Performance Benchmarks

**Files:**
- Create: `database/scripts/03_explain_benchmarks.sql`
- Create: `docs/EXPLAIN_ANALYZE_REPORT.md`

**Step 1: Write SQL benchmark script for top 3 query workloads**
1. Workload 1: Assessment consolidation query (filtering by school_year_id, term_id, type, grade_level_id).
2. Workload 2: Teacher assignment active lookup (filtering by school_year_id, section_id, subject_id with effective_until IS NULL).
3. Workload 3: Teacher approval status query (filtering by approval_status).

**Step 2: Run EXPLAIN (ANALYZE, BUFFERS) before and after index utilization**
Execute queries and record execution plans:
- Capture Planning Time vs Execution Time.
- Capture Total Cost (`cost=...`).
- Capture Scan Method: `Index Scan using assess_records_consolidation_idx` vs `Seq Scan`.

**Step 3: Document findings with deep technical explanation**
Create `docs/EXPLAIN_ANALYZE_REPORT.md` with side-by-side execution trees, cost breakdowns, and explanations formatted for defense questioning.

**Step 4: Commit changes**
Run:
```bash
git add database/scripts/03_explain_benchmarks.sql docs/EXPLAIN_ANALYZE_REPORT.md
git commit -m "docs(database): capture and document PostgreSQL EXPLAIN ANALYZE benchmarks"
```

---

### Task 5: Implement Automated Backup & Restore System with Proven Verification

**Files:**
- Create: `app/Console/Commands/DatabaseBackupCommand.php`
- Create: `app/Console/Commands/DatabaseRestoreCommand.php`
- Create: `scripts/backup.ps1`
- Create: `scripts/restore.ps1`
- Create: `scripts/backup.sh`
- Create: `scripts/restore.sh`
- Output: `database/backups/dnihs_proven_backup.sql`
- Test: `tests/Feature/DatabaseBackupRestoreTest.php`

**Step 1: Create Artisan backup command**
`php artisan db:backup`:
- Reads `.env` parameters (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
- Executes `pg_dump` with `--clean --if-exists --no-owner --no-privileges` to produce clean portable SQL.
- Falls back to native PHP PDO table dumper if `pg_dump` binary is absent in client environment.
- Saves to `database/backups/dnihs_backup_YYYYMMDD_HHMMSS.sql`.
- Generates SHA-256 integrity hash.

**Step 2: Create Artisan restore command**
`php artisan db:restore {file?}`:
- Validates backup file exists and verifies integrity hash.
- Restores database schema and records.
- Executes integrity check: counts rows in `users`, `school_years`, `sections`, `subjects`, `assessment_records`.
- Prints verification summary table to console.

**Step 3: Create companion PowerShell & Bash scripts**
- `scripts/backup.ps1` / `scripts/backup.sh`
- `scripts/restore.ps1` / `scripts/restore.sh`

**Step 4: Execute real backup, test restore, and record proof**
Run: `php artisan db:backup`
Expected: Backup file generated in `database/backups/`.
Run: `php artisan db:restore --verify-only`
Expected: Verification PASS with all table row counts matched.

**Step 5: Write feature test to ensure automated command resilience**
Run: `php artisan test tests/Feature/DatabaseBackupRestoreTest.php`
Expected: PASS.

**Step 6: Commit changes**
Run:
```bash
git add app/Console/Commands/DatabaseBackupCommand.php app/Console/Commands/DatabaseRestoreCommand.php scripts/* database/backups/* tests/Feature/DatabaseBackupRestoreTest.php
git commit -m "feat(database): implement automated backup and restore commands with verification"
```

---

### Task 6: Hardening Laravel Connection Settings & Documentation

**Files:**
- Modify: `.env.example`
- Modify: `config/database.php` (add inline single-line explanatory comments)
- Test: `tests/Feature/DatabaseConnectionTest.php`

**Step 1: Enhance `.env.example`**
Add explicit, documented sections for:
- PostgreSQL Cloud Connection (Supabase, Neon, Render)
- Local PostgreSQL Connection
- Local MySQL / MariaDB alternative configuration
- Connection timeouts, SSL modes, and pooler guidance.

**Step 2: Add inline architectural comments to `config/database.php`**
Ensure every setting (`search_path`, `sslmode`, `charset`, `collation`, `prefix_indexes`) has concise, informative inline comments explaining how it protects data integrity and performance.

**Step 3: Write connection verification test**
Ensure `tests/Feature/DatabaseConnectionTest.php` tests that the database driver is pgsql, foreign key constraints are enabled, and read/write operations succeed.

**Step 4: Run test**
Run: `php artisan test tests/Feature/DatabaseConnectionTest.php`
Expected: PASS.

**Step 5: Commit changes**
Run:
```bash
git add .env.example config/database.php tests/Feature/DatabaseConnectionTest.php
git commit -m "chore(database): harden Laravel connection settings and documentation"
```

---

### Task 7: Create Publication-Grade Database Architecture & Defense Master Guide

**Files:**
- Create: `docs/DATABASE_ARCHITECTURE_AND_DEFENSE.md`
- Create: `database/README.md`

**Step 1: Write complete documentation covering all rubric deliverables**
1. **Title & Executive Overview**: Purpose of database in the DNIHS Decision Support System.
2. **Entity-Relationship Diagram (ERD)**: Complete Mermaid diagram showing all 9 tables, cardinality, PKs, FKs, and cascade/restrict rules.
3. **Data Dictionary**: Comprehensive specification of all tables, fields, data types, nullability, defaults, keys, and descriptions.
4. **Database Normalization Analysis**: Formal mathematical/logical proof of 1NF, 2NF, and 3NF compliance.
5. **Indexing & Performance Tuning**: Detailed explanation of indexes and EXPLAIN ANALYZE output reading.
6. **Stored Functions & Triggers**: Code listings and operational rationale.
7. **Security, Roles & RLS Policies**: Database-level security architecture.
8. **Disaster Recovery & Backup Procedures**: Step-by-step backup and verified restore instructions.
9. **Oral Defense Master Cheat Sheet**: 12 anticipated panelist questions with exact technical answers.

**Step 2: Commit documentation**
Run:
```bash
git add docs/DATABASE_ARCHITECTURE_AND_DEFENSE.md database/README.md
git commit -m "docs(database): create comprehensive database architecture and oral defense guide"
```

---

### Task 8: Final End-to-End Test Suite Execution & Submission Checklist

**Files:**
- Audit: All test files in `tests/Feature`
- Audit: Git status and branch cleanliness

**Step 1: Run complete test suite**
Run: `php artisan test`
Expected: All tests pass with zero failures.

**Step 2: Verify compliance with all rubric items**
- [x] Normalization, keys, and relationships (3NF + ERD)
- [x] Indexes and reading EXPLAIN output (Benchmark report + defense notes)
- [x] Function or trigger (PL/pgSQL trigger function + audit table)
- [x] Roles and privileges / RLS (PostgreSQL roles + RLS policies)
- [x] Backup and restore (Working scripts + proven restore log)
- [x] Laravel connection settings (.env.example + config documentation)
- [x] Presentation & Defense readiness (Complete defense cheat sheet)

**Step 3: Push commits to remote**
Run: `git push origin main`
Expected: Clean sync with GitHub repository.
