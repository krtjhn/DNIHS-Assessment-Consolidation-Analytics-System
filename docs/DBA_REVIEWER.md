# DNIHS Capstone — Master Database Administration (DBA) & Line-by-Line SQL/Script Reviewer

This unified group DBA reviewer is engineered to help the entire team achieve **100% (Excellent: 90–100%)** on both the **DBA Group Output Rubric (70%)** and the **DBA Individual Questioning Rubric (30%)** for the Digos National High School (DNIHS) Assessment Consolidation, Analytics & Decision Support System.

---

## Table of Contents
1. [Part 1: Final Audit vs. DBA Group Output Rubric (70%) & 5 Core Checkpoints](#part-1-final-audit-vs-dba-group-output-rubric-70--5-core-checkpoints)
2. [Part 2: How to Read PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` Output Like a Pro](#part-2-how-to-read-postgresql-explain-analyze-buffers-output-like-a-pro)
3. [Part 3: Complete Line-by-Line Query, Migration & Script Tracing Guide (35% Weight)](#part-3-complete-line-by-line-query-migration--script-tracing-guide-35-weight)
   - [3.1 Core Relational Schema & Foreign Key Strategy (`database/migrations/2026_10_07_*`)](#31-core-relational-schema--foreign-key-strategy-databasemigrations2026_10_07_)
   - [3.2 Performance Indexes & Composite Keys (`2026_10_18_120000_add_performance_indexes_and_constraints.php`)](#32-performance-indexes--composite-keys-2026_10_18_120000_add_performance_indexes_and_constraintsphp)
   - [3.3 3NF Normalization, SoftDeletes & Partial Unique Index (`2026_10_18_130000_enhance_database_design_for_dss.php`)](#33-3nf-normalization-softdeletes--partial-unique-index-2026_10_18_130000_enhance_database_design_for_dssphp)
   - [3.4 PL/pgSQL Functions, Triggers & 19-Column Forensic Audit Table (`2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php`)](#34-plpgsql-functions-triggers--19-column-forensic-audit-table-2026_10_21_132746_create_assessment_metrics_trigger_and_auditphp)
   - [3.5 PostgreSQL Roles, Least-Privilege Grants & Row-Level Security (`2026_10_22_000003_configure_database_roles_and_rls.php`)](#35-postgresql-roles-least-privilege-grants--row-level-security-2026_10_22_000003_configure_database_roles_and_rlsphp)
   - [3.6 Schema Streamlining (`2026_10_23_220000_streamline_schema_drop_unneeded_columns.php`)](#36-schema-streamlining-2026_10_23_220000_streamline_schema_drop_unneeded_columnsphp)
   - [3.7 Automated Backup Script & Scheduler (`DatabaseBackupCommand.php` & `routes/console.php`)](#37-automated-backup-script--scheduler-databasebackupcommandphp--routesconsolephp)
   - [3.8 Proven Database Restore & Integrity Verifier (`DatabaseRestoreCommand.php`)](#38-proven-database-restore--integrity-verifier-databaserestorecommandphp)
   - [3.9 Live `EXPLAIN ANALYZE` Benchmark Script (`scripts/run_benchmarks.php`)](#39-live-explain-analyze-benchmark-script-scriptsrun_benchmarksphp)
   - [3.10 Laravel Connection Settings & Live Verification Test (`config/database.php` & `DatabaseConnectionTest.php`)](#310-laravel-connection-settings--live-verification-test-configdatabasephp--databaseconnectiontestphp)
4. [Part 4: "Understanding of Design Decisions" — Why, Trade-Offs & Alternatives (35% Weight)](#part-4-understanding-of-design-decisions--why-trade-offs--alternatives-35-weight)
5. [Part 5: Applied "What If" or Live SQL/DBA Change Scenarios (15% Weight)](#part-5-applied-what-if-or-live-sqldba-change-scenarios-15-weight)
6. [Part 6: Clarity of Communication & Live Demo Command Cheat Sheet (15% Weight)](#part-6-clarity-of-communication--live-demo-command-cheat-sheet-15-weight)

---

## Part 1: Final Audit vs. DBA Group Output Rubric (70%) & 5 Core Checkpoints

### 1.1 Verification of the 5 Core DBA Panel Checkpoints

| DBA Panel Checkpoint | Status | Exact File & Line Evidence in Codebase |
| :--- | :---: | :--- |
| **1. Normalization, keys, and relationships** | **PASS (100%)** | **11 Core Relational Tables** in Third Normal Form (**3NF**). Surrogate `BIGINT` Primary Keys (`id`), composite PK `(user_id, role_id)` on `role_user`, 5-column composite unique key `assess_sy_term_sec_subj_type_unique` on `assessment_records`, and deliberate `RESTRICT` vs. `CASCADE` vs. `SET NULL` Foreign Keys across [`database/migrations/`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations). |
| **2. Indexes and reading `EXPLAIN` output** *(Constraints, keys, $\ge 1$ useful index, Function or trigger)* | **PASS (100%)** | **Composite B-Tree Index** `assess_records_consolidation_idx` (**-78.9% cost reduction**), **Partial Unique Index** `teaching_assignments_sy_sec_subj_active_unique` (**-90.2% cost reduction**), **Single-Column Indexes** (`users_approval_status_idx`, `school_years_is_active_idx`, `sections_grade_level_id_idx`), **2 PL/pgSQL Functions + 2 Triggers** in [`2026_10_21_132746`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php), and live benchmark script [`scripts/run_benchmarks.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/scripts/run_benchmarks.php). |
| **3. Roles and privileges** *(At least two roles with different privileges)* | **PASS (100%)** | **2 PostgreSQL Roles** in [`2026_10_22_000003_configure_database_roles_and_rls.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_22_000003_configure_database_roles_and_rls.php#L14-L43): `dnihs_admin_role` (`ALL PRIVILEGES`) vs. `dnihs_teacher_staff` (`SELECT` on reference tables, `SELECT, INSERT, UPDATE` on `assessment_records`, **strictly NO `DELETE`**), plus **Row-Level Security (RLS)** enabled on all 20 public tables. |
| **4. Backup and restore** *(Backup script works, and the restore is proven)* | **PASS (100%)** | **Backup CLI**: [`DatabaseBackupCommand.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/app/Console/Commands/DatabaseBackupCommand.php) (`php artisan db:backup` with `pg_dump` + PDO fallback + SHA-256 hash). **Restore & Verifier CLI**: [`DatabaseRestoreCommand.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/app/Console/Commands/DatabaseRestoreCommand.php) (`php artisan db:restore` and `php artisan db:restore --verify-only` proving 100% data fidelity across all 10 tables). |
| **5. Laravel connection settings** | **PASS (100%)** | [`config/database.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/config/database.php#L87-L113) configures the `pgsql` driver connected to Supabase PostgreSQL 17.11 (`aws-0-ap-northeast-1.pooler.supabase.com:5432`) with `'search_path' => 'public'` and `'sslmode' => env('DB_SSLMODE', 'prefer')` (`require` in `.env`), verified live by [`DatabaseConnectionTest.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/tests/Feature/DatabaseConnectionTest.php). |

---

### 1.2 Verification of DBA Group Output Rubric (70% Weight)

1. **Correctness & Functionality (40%)**: All 20 migrations, 2 PL/pgSQL functions, 2 triggers, 4 RLS policies, backup/restore scripts, and benchmark scripts execute without errors against live Supabase PostgreSQL 17.11.
2. **Database Design & Administration Quality (20%)**: Strict 3NF normalization, domain integrity enforcement inside PL/pgSQL (`RAISE EXCEPTION` if `total_items <= 0` or `mean > total_items`), B-Tree + partial indexing, least-privilege roles, RLS, and SHA-256 verified backups.
3. **Integration with the Web Application — Laravel (20%)**: Seamless Eloquent ORM integration, atomic `DB::transaction()` blocks with automatic rollback, JSON array casting, and 5/5 passing assertions in `DatabaseConnectionTest.php`.
4. **Documentation & Presentation (10%)**: Mermaid ERD, Data Dictionary, 3NF Formal Proof in [`docs/DATABASE_ARCHITECTURE_AND_DEFENSE.md`](file:///c:/Users/acer/Documents/BSIT/m_capstone/docs/DATABASE_ARCHITECTURE_AND_DEFENSE.md), execution plans in [`docs/EXPLAIN_ANALYZE_REPORT.md`](file:///c:/Users/acer/Documents/BSIT/m_capstone/docs/EXPLAIN_ANALYZE_REPORT.md), and single-line `//` comments on every migration and command.
5. **Timeliness & Compliance with Instructions (10%)**: Clean Git history, zero dead migrations or SQLite remnants, and exact adherence to specifications.

---

## Part 2: How to Read PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` Output Like a Pro

During questioning, the panel will show or ask you to run `php scripts/run_benchmarks.php` and ask: **"Explain what these numbers in the `EXPLAIN ANALYZE` output mean."**

Here is the exact anatomy of our PostgreSQL execution plan output:

```text
Index Scan using assess_records_consolidation_idx on public.assessment_records  (cost=0.14..8.16 rows=1 width=66) (actual time=0.042..0.043 rows=0 loops=1)
  Index Cond: ((assessment_records.school_year_id = 1) AND (assessment_records.term_id = 1) AND ((assessment_records.type)::text = 'term_exam'::text) AND (assessment_records.grade_level_id = 1))
  Filter: (assessment_records.deleted_at IS NULL)
  Buffers: shared hit=3
Planning Time: 0.195 ms
Execution Time: 0.068 ms
```

### How to Explain Every Field to the Panel:
1. **Scan Node Type (`Seq Scan` vs. `Index Scan`)**:
   - **`Seq Scan` (Sequential Scan)**: PostgreSQL reads every single page of the table from disk/memory top-to-bottom ($O(N)$ complexity). Slow as the table grows across multiple school years.
   - **`Index Scan`**: PostgreSQL traverses the B-Tree index (`assess_records_consolidation_idx`) in logarithmic time ($O(\log N)$) to jump directly to the matching tuple TIDs (Tuple IDs).
2. **`cost=0.14..8.16` (Estimated Planner Cost Units)**:
   - **First number (`0.14` — Startup Cost)**: The estimated cost before the first row can be returned (e.g., descending the B-Tree root to the leaf node). For a `Seq Scan`, startup cost is `0.00` because it starts reading page 0 immediately, but its total cost is much higher!
   - **Second number (`8.16` — Total Cost)**: The estimated total cost to return all matching rows (measured in arbitrary planner page-fetch units).
     - On our consolidation query, `Seq Scan` cost was **`38.75`** vs. `Index Scan` cost of **`8.16`** (**78.9% cost reduction**).
     - On our active teaching assignment lookup, `Seq Scan` cost was **`83.50`** vs. `Index Scan` cost of **`8.15`** (**90.2% cost reduction**).
3. **`rows=1 width=66` (Planner Estimates)**:
   - `rows=1`: How many rows the query planner *estimates* will match based on `pg_statistic`.
   - `width=66`: Average byte size (`66 bytes`) of each returned tuple based on the selected columns.
4. **`actual time=0.042..0.043 rows=0 loops=1` (Real Execution Telemetry from `ANALYZE`)**:
   - Unlike plain `EXPLAIN` (which only *estimates*), `EXPLAIN (ANALYZE)` **actually executes the query**!
   - `0.042..0.043`: Actual wall-clock milliseconds to fetch the first row (`0.042 ms`) and all rows (`0.043 ms`).
   - `loops=1`: Number of times this plan node was executed.
5. **`Index Cond` vs. `Filter`**:
   - **`Index Cond`**: Conditions evaluated **inside the B-Tree index itself** (`school_year_id = 1 AND term_id = 1 AND type = 'term_exam' AND grade_level_id = 1`).
   - **`Filter`**: Conditions checked on the heap tuple *after* the index lookup (`deleted_at IS NULL`). *(Note: On `teaching_assignments_sy_sec_subj_active_unique`, there is NO post-index Filter for `effective_until IS NULL` because the index itself is a **Partial Index** containing `WHERE effective_until IS NULL`!)*
6. **`Buffers: shared hit=3` (Memory Cache Efficiency from `BUFFERS`)**:
   - `shared hit=3` means only **3 PostgreSQL 8KB memory pages** (`24 KB` total) were read directly from shared RAM cache (`shared_buffers`) with **0 physical disk reads** (`read=0`), whereas the Sequential Scan had to scan **29 to 65 pages**!

---

## Part 3: Complete Line-by-Line Query, Migration & Script Tracing Guide (35% Weight)

> [!TIP]
> **How to Trace SQL & Scripts Without "Reading Line by Line"**:
> Point to the migration/script block, state the **Database Object / Constraint**, explain **what integrity or performance problem it solves**, and state **what happens when invalid data hits it**.

---

### 3.1 Core Relational Schema & Foreign Key Strategy (`database/migrations/2026_10_07_*`)

1. **[`0001_01_01_000000_create_users_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/0001_01_01_000000_create_users_table.php#L12-L23) & [`2026_10_07_211500_add_approval_status_to_users_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_211500_add_approval_status_to_users_table.php#L11-L18)**:
   - Creates `users` with `id` (BIGSERIAL PK), `name`, `email` (`UNIQUE` index `users_email_unique`), `password`, `is_active` (`BOOLEAN DEFAULT true`), `approval_status` (`VARCHAR DEFAULT 'approved'`), and `approved_at` (`TIMESTAMP NULL`).
2. **[`2026_10_07_081228_create_roles_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081228_create_roles_table.php#L11-L16) & [`2026_10_07_081229_create_role_user_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081229_create_role_user_table.php)**:
   - `roles`: `id` (PK), `name` (`UNIQUE`), `display_name`.
   - `role_user`: Many-to-many junction table with `user_id` (`FK -> users.id ON DELETE CASCADE`), `role_id` (`FK -> roles.id ON DELETE CASCADE`), and **Composite Primary Key** `$table->primary(['user_id', 'role_id'])` so the same role can never be attached twice to the same user.
3. **[`2026_10_07_081230_create_grade_levels_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081230_create_grade_levels_table.php#L11-L16)**:
   - `id` (PK), `level` (`SMALLINT UNIQUE` — 7, 8, 9, 10), `display_name` (`'Grade 7'`, etc.).
4. **[`2026_10_07_081231_create_school_years_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081231_create_school_years_table.php) & [`2026_10_07_081232_create_terms_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081232_create_terms_table.php#L11-L20)**:
   - `school_years`: `id` (PK), `name` (`UNIQUE`, e.g., `'2025-2026'`), `start_date`, `end_date`, `is_active`.
   - `terms`: `school_year_id` (`FK -> school_years.id ON DELETE CASCADE`), `term_number` (1, 2, 3), `name`, `status` (`'pending'`, `'active'`, `'completed'`).
   - **Line 19 of `create_terms_table.php`**: `$table->unique(['school_year_id', 'term_number'])` prevents creating two "Term 1" rows inside the same school year.
5. **[`2026_10_07_081233_create_sections_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081233_create_sections_table.php#L11-L20)**:
   - `school_year_id` (`CASCADE`), `grade_level_id` (`RESTRICT` — you cannot delete Grade 7 if sections exist), `name`, `is_active`.
   - **Line 19**: Composite unique constraint `$table->unique(['school_year_id', 'grade_level_id', 'name'])` allows "Section Rizal" in SY 2025-2026 and "Section Rizal" in SY 2026-2027, while blocking two "Grade 7 - Rizal" sections in the same school year!
6. **[`2026_10_07_081234_create_subjects_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081234_create_subjects_table.php)**:
   - `grade_level_id` (`FK -> grade_levels.id ON DELETE RESTRICT`), `name`, `is_active`, and composite unique constraint `(grade_level_id, name)`.
7. **[`2026_10_07_081235_create_teaching_assignments_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081235_create_teaching_assignments_table.php#L11-L21)**:
   - Links `user_id`, `school_year_id`, `section_id`, `subject_id` (all with `restrictOnDelete()`), `effective_from` (`DATE`), `effective_until` (`DATE NULL`), and `assigned_by` (`FK -> users.id ON DELETE SET NULL` — if an admin account is removed, the assignment remains valid with `assigned_by = NULL`).
8. **[`2026_10_07_081236_create_assessment_records_table.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_07_081236_create_assessment_records_table.php#L11-L37)**:
   - Links `school_year_id`, `term_id`, `grade_level_id`, `section_id`, `subject_id`, `teacher_id`.
   - Stores `type` (`'diagnostic'` or `'term_exam'`), `total_items`, `raw_scores` (`JSON`), `no_of_entries`, `mean`, `mps`, `sd`, `highest_score`, `lowest_score`, `least_learned_competency`, `remarks`.
   - **Lines 33–36**: 5-column composite unique constraint `assess_sy_term_sec_subj_type_unique` on `['school_year_id', 'term_id', 'section_id', 'subject_id', 'type']` guaranteeing at the database level that a section can only have ONE Diagnostic score sheet and ONE Term Exam score sheet per subject per term.

---

### 3.2 Performance Indexes & Composite Keys (`2026_10_18_120000_add_performance_indexes_and_constraints.php`)

**File**: [`database/migrations/2026_10_18_120000_add_performance_indexes_and_constraints.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_18_120000_add_performance_indexes_and_constraints.php#L10-L65)

- **Lines 13–15 (`users_approval_status_idx`)**: B-Tree index on `users(approval_status)` accelerating admin lookups for `'pending'`, `'approved'`, and `'rejected'` teacher registrations.
- **Lines 18–20 (`school_years_is_active_idx`)**: B-Tree index on `school_years(is_active)` accelerating `SchoolYear::active()->first()` which runs on nearly every request.
- **Lines 23–25 (`sections_grade_level_id_idx`)**: B-Tree index on `sections(grade_level_id)` speeding up grade-level section filtering.
- **Lines 36–41 (`assess_records_consolidation_idx`)**:
  - **4-Column Composite B-Tree Index** on `['school_year_id', 'term_id', 'type', 'grade_level_id']`.
  - **Why this exact column order (Leftmost Prefix Rule)?** Because `GET /api/assessments/consolidation` *always* filters by `school_year_id` and `term_id` (required), and *optionally* filters by `type` and `grade_level_id`! By placing the required equality columns (`school_year_id, term_id`) at the leading left edge of the B-Tree index, PostgreSQL can use this single index whether the user requests a school-wide consolidation (2 filters) or a grade-specific consolidation (4 filters)!

---

### 3.3 3NF Normalization, SoftDeletes & Partial Unique Index (`2026_10_18_130000_enhance_database_design_for_dss.php`)

**File**: [`database/migrations/2026_10_18_130000_enhance_database_design_for_dss.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_18_130000_enhance_database_design_for_dss.php#L10-L134)

- **Lines 14–47 (3NF Normalization of `subjects`)**:
  - Drops any redundant `department` column (which created a transitive dependency `subject_id -> name -> department`, violating 3NF) and adds standardized DepEd curriculum `code` (`FIL-7`, `MATH-8`, `SCI-9`, `ESP-10`).
- **Lines 50–72 (`SoftDeletes` for Multi-Year DSS Retention)**:
  - Adds `deleted_at` (`TIMESTAMP NULL`) to `users`, `sections`, `school_years`, and `assessment_records` so historical academic data is never permanently destroyed by accidental deletes.
- **Lines 74–85 (PostgreSQL Partial Unique Index for Substitute Teachers)**:
  ```sql
  CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique
  ON teaching_assignments (school_year_id, section_id, subject_id)
  WHERE effective_until IS NULL;
  ```
  - Enforces that only **one active teacher** (`effective_until IS NULL`) can hold a class `(school_year_id, section_id, subject_id)` at a time, while allowing unlimited historical/concluded rows (`effective_until IS NOT NULL`) for mid-year substitute handoffs!
- **Lines 87–96 (`restrictOnDelete()` Hardening on `assessment_records.teacher_id`)**:
  - Replaces `cascadeOnDelete()` with `restrictOnDelete()` on `assessment_records.teacher_id` so PostgreSQL physically refuses to hard-delete a `users` row if that teacher has ever encoded an assessment record.

---

### 3.4 PL/pgSQL Functions, Triggers & 19-Column Forensic Audit Table (`2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php`)

**File**: [`database/migrations/2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php#L10-L174)

> **How to Trace Verbally**:
> *"Migration `2026_10_21_132746` establishes our procedural database layer with two PL/pgSQL functions and two triggers. First, `fn_calculate_assessment_metrics()` fires `BEFORE INSERT OR UPDATE` on `assessment_records`: it validates that `total_items > 0` and `mean <= total_items`, then automatically calculates `NEW.mps` and assigns default mastery remarks directly inside PostgreSQL before the row is written to disk. Second, `fn_audit_assessment_records()` fires `AFTER UPDATE OR DELETE` on `assessment_records`: it captures a complete before-and-after snapshot (`OLD.*` and `NEW.*`) of all statistical columns and inserts an immutable forensic audit row into the 19-column `assessment_audit_logs` table."*

- **Lines 14–36 (19-Column `assessment_audit_logs` Schema)**:
  - Columns: `id`, `assessment_id`, `action` (`'UPDATE'` or `'DELETE'`), `old_mean`, `new_mean`, `old_mps`, `new_mps`, `old_sd`, `new_sd`, `old_highest_score`, `new_highest_score`, `old_lowest_score`, `new_lowest_score`, `old_no_of_entries`, `new_no_of_entries`, `old_remarks`, `new_remarks`, `teacher_id`, `created_at`.
  - *(Note: In migration [`2026_10_22_000004` Line 17](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_22_000004_provision_core_system_master_data.php#L16-L18), we dropped the foreign key constraint on `assessment_audit_logs.assessment_id` so that even if a record is hard-deleted during a `DELETE` trigger event, its `assessment_id` is permanently retained in the audit log without a foreign key violation or nullification!)*
- **Lines 42–70 (`fn_calculate_assessment_metrics()` — Pre-Computation Trigger Function)**:
  - **Lines 46–48**: `IF NEW.total_items IS NULL OR NEW.total_items <= 0 THEN RAISE EXCEPTION 'total_items must be greater than zero'; END IF;`
  - **Lines 50–52**: `IF NEW.mean > NEW.total_items THEN RAISE EXCEPTION 'mean score cannot exceed total_items'; END IF;`
  - **Line 55**: `NEW.mps := ROUND((NEW.mean / NEW.total_items::numeric) * 100.0, 2);` — Casts `total_items` to `numeric` to prevent integer division truncation, computes MPS, and rounds to 2 decimal places.
  - **Lines 58–66**: Automatically classifies `NEW.remarks` if empty (`>= 75.00` Mastered, `>= 50.00` Nearly Mastered, `< 50.00` Low Mastery).
  - **Line 68**: `RETURN NEW;` hands the modified record to PostgreSQL to be written.
- **Lines 74–80 (`trg_assessment_records_before_insert_or_update`)**:
  - Must be a **`BEFORE`** trigger (`BEFORE INSERT OR UPDATE ... FOR EACH ROW`) because it modifies `NEW.mps` and `NEW.remarks` *before* the tuple is written to the table heap.
- **Lines 84–146 (`fn_audit_assessment_records()` — Forensic Audit Trigger Function)**:
  - **Lines 87–114 (`IF (TG_OP = 'UPDATE')`)**: Inserts `OLD.id`, `'UPDATE'`, and all pairs of `OLD.<metric>, NEW.<metric>` into `assessment_audit_logs`, then returns `NEW`.
  - **Lines 115–143 (`ELSIF (TG_OP = 'DELETE')`)**: Inserts `OLD.id`, `'DELETE'`, and `OLD.<metric>, NULL` into `assessment_audit_logs`, then returns `OLD`.
- **Lines 150–156 (`trg_assessment_audit_logger`)**:
  - Attached as an **`AFTER`** trigger (`AFTER UPDATE OR DELETE ... FOR EACH ROW`) because audit logging should only record operations that actually succeeded after all constraints passed.

---

### 3.5 PostgreSQL Roles, Least-Privilege Grants & Row-Level Security (`2026_10_22_000003_configure_database_roles_and_rls.php`)

**File**: [`database/migrations/2026_10_22_000003_configure_database_roles_and_rls.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_22_000003_configure_database_roles_and_rls.php#L10-L151)

- **Lines 14–25 (Idempotent Role Creation via PL/pgSQL `DO $$` Block)**:
  - Queries `pg_catalog.pg_roles` and creates two group roles:
    1. `dnihs_admin_role` (`NOLOGIN`) — Database/System Administrator role.
    2. `dnihs_teacher_staff` (`NOLOGIN`) — Faculty/Teacher restricted role.
- **Lines 28–31 (CVE-2018-1058 Search Path Hardening)**:
  ```sql
  ALTER FUNCTION fn_calculate_assessment_metrics() SET search_path = public, pg_temp;
  ALTER FUNCTION fn_audit_assessment_records() SET search_path = public, pg_temp;
  ```
  - Prevents malicious users from creating Trojan-horse functions in a temporary schema to hijack trigger execution!
- **Lines 34–43 (Least-Privilege `GRANT` Separation)**:
  - `dnihs_admin_role`: Granted `ALL PRIVILEGES ON ALL TABLES` and `ALL SEQUENCES` in `public`.
  - `dnihs_teacher_staff`:
    - Granted **read-only `SELECT`** on reference tables (`grade_levels, school_years, terms, sections, subjects, users, teaching_assignments`).
    - Granted **`SELECT, INSERT, UPDATE` ONLY** on `assessment_records` (and `USAGE, SELECT` on sequences for `INSERT`).
    - **Zero `DELETE` privilege** on `assessment_records` and **zero access** to modify `assessment_audit_logs`!
- **Lines 46–74 (Row-Level Security Enabled Across All 20 Tables)**:
  - Loops through all 20 public tables and executes `ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;`.
- **Lines 77–114 (Granular Per-Operation RLS Policies on `assessment_records`)**:
  - `p_assessment_admin_all`: `FOR ALL TO dnihs_admin_role USING (true) WITH CHECK (true)` — Full access for admins.
  - `p_assessment_teacher_select`: `FOR SELECT TO dnihs_teacher_staff USING (deleted_at IS NULL)` — Teachers can only query active (non-soft-deleted) rows.
  - `p_assessment_teacher_insert`: `FOR INSERT TO dnihs_teacher_staff WITH CHECK (deleted_at IS NULL)` — Teachers can only insert active rows.
  - `p_assessment_teacher_update`: `FOR UPDATE TO dnihs_teacher_staff USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL)` — Teachers can only update active rows.

---

### 3.6 Schema Streamlining (`2026_10_23_220000_streamline_schema_drop_unneeded_columns.php`)

**File**: [`database/migrations/2026_10_23_220000_streamline_schema_drop_unneeded_columns.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_23_220000_streamline_schema_drop_unneeded_columns.php#L10-L46)

- **Lines 14–18**: Drops unused `email_verified_at` from `users` because account activation is governed strictly by `approval_status` and `approved_at`.
- **Lines 21–28**: Drops redundant `updated_at` from the `role_user` junction table (since role attachments are immutable link records) and sets `ALTER TABLE role_user ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;`.

---

### 3.7 Automated Backup Script & Scheduler (`DatabaseBackupCommand.php` & `routes/console.php`)

**File**: [`app/Console/Commands/DatabaseBackupCommand.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/app/Console/Commands/DatabaseBackupCommand.php#L10-L205)

> **How to Trace Verbally**:
> *"When `php artisan db:backup` runs, it reads the PostgreSQL credentials from `config/database.php` and ensures `database/backups/` exists. It first locates the native `pg_dump` binary and executes a clean SQL dump (`--clean --if-exists --no-owner --no-privileges`). If `pg_dump` is unavailable on a machine, it automatically falls back to `exportViaPdo()`, which queries `information_schema.tables` and writes idempotent `INSERT ... ON CONFLICT DO NOTHING` SQL statements. Finally, it computes a cryptographic SHA-256 checksum (`hash_file('sha256', ...)`), writes the `.sha256` verification file, and updates `dnihs_proven_backup.sql`."*

- **Lines 25–35**: Reads `host`, `port`, `database`, `username`, `password` from `config('database.connections.pgsql')`.
- **Lines 53–82 (Primary Engine — Native `pg_dump`)**:
  - `resolvePgDumpBinary()` (Lines 127–149) checks system `PATH` and standard Windows PostgreSQL 16/17/18 installation paths.
  - Passes `PGPASSWORD` via environment variable (`new Process($cmd, null, ['PGPASSWORD' => $password])` on Line 71) so the database password is never exposed in process command-line arguments!
- **Lines 85–88 & 152–204 (Resilient Fallback — `exportViaPdo()`)**:
  - Queries `information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'` (Lines 164–169) and serializes every table's rows into `INSERT INTO ... VALUES (...) ON CONFLICT DO NOTHING;` (Line 192).
- **Lines 96–102 (Cryptographic Provenance)**:
  - Generates `hash_file('sha256', $filePath)` and saves `<filename>.sql.sha256` alongside `dnihs_proven_backup.sql`.
- **Automated Nightly Schedule ([`routes/console.php` Lines 345–348](file:///c:/Users/acer/Documents/BSIT/m_capstone/routes/console.php#L345-L348))**:
  ```php
  Schedule::command('db:backup')
      ->dailyAt('02:00')
      ->withoutOverlapping()
      ->runInBackground();
  ```

---

### 3.8 Proven Database Restore & Integrity Verifier (`DatabaseRestoreCommand.php`)

**File**: [`app/Console/Commands/DatabaseRestoreCommand.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/app/Console/Commands/DatabaseRestoreCommand.php#L10-L185)

- **Lines 28–31 (`--verify-only` Mode)**: Allows safe live verification during the oral defense without overwriting active data.
- **Lines 34–45 (Automatic Latest Backup Discovery)**: If no filename argument is passed, uses `glob("{$backupDir}/*.sql")` and `usort()` by `filemtime()` descending to pick the newest backup automatically.
- **Lines 58–68 (Pre-Restore SHA-256 Tamper Check)**:
  - Before executing a single line of SQL, recomputes `hash_file('sha256', $filePath)` and compares it against `<file>.sha256`. If the backup file was corrupted or tampered with, aborts immediately with exit code `1`!
- **Lines 77–109 (Dual-Engine Restore: `psql` $\to$ PDO `DB::unprepared`)**:
  - Restores via native `psql --file=...` or falls back to `DB::unprepared(file_get_contents($filePath))`.
- **Lines 117–159 (`runVerificationAssertions()` — Proven Recovery Rubric Proof)**:
  - Queries live row counts across all 10 core tables (`users`, `roles`, `grade_levels`, `school_years`, `terms`, `subjects`, `sections`, `teaching_assignments`, `assessment_records`, `assessment_audit_logs`) and asserts that `admin@gmail.com` exists, an active school year exists, and `>= 32` DepEd subjects exist.

---

### 3.9 Live `EXPLAIN ANALYZE` Benchmark Script (`scripts/run_benchmarks.php`)

**File**: [`scripts/run_benchmarks.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/scripts/run_benchmarks.php#L1-L82)

- **Lines 16–32 (`runExplain()` Helper)**:
  - Wraps each benchmark inside `DB::transaction(...)` (Line 21) so that `SET LOCAL enable_indexscan = off` and `SET LOCAL enable_bitmapscan = off` (Lines 38–39) apply **only to that transaction** and never affect other database sessions!
  - Executes `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)` (Line 25) and prints the live PostgreSQL execution plan.
- **Lines 35–52 (Benchmark 1A vs. 1B — Consolidation Composite Index)**:
  - Compares Forced Sequential Scan (`enable_indexscan = off`) vs. Composite Index Scan (`assess_records_consolidation_idx`) on `assessment_records`.
- **Lines 55–72 (Benchmark 2A vs. 2B — Partial Unique Index)**:
  - Compares Forced Sequential Scan vs. Partial Index Scan (`teaching_assignments_sy_sec_subj_active_unique`) on `teaching_assignments WHERE effective_until IS NULL`.
- **Lines 75–82 (Benchmark 3 — Teacher Approval Status Index)**:
  - Verifies index scan using `users_approval_status_idx` for `WHERE approval_status = 'pending'`.

---

### 3.10 Laravel Connection Settings & Live Verification Test (`config/database.php` & `DatabaseConnectionTest.php`)

#### A. [`config/database.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/config/database.php#L67-L92) (Lines 67–92)
- `'driver' => 'pgsql'`: Uses PHP's native `pdo_pgsql` C-extension.
- `'host' => env('DB_HOST')`: Connects to Supabase Transaction/Session Pooler (`aws-0-ap-northeast-1.pooler.supabase.com`) on port `5432`.
- `'charset' => 'utf8'`: Full Unicode support (e.g., Filipino characters like `ñ` in section or teacher names).
- `'search_path' => 'public'`: Explicitly locks the connection's schema resolution to `public` so unqualified table names cannot be intercepted by untrusted schemas.
- `'sslmode' => env('DB_SSLMODE', 'prefer')`: Set to `'require'` in `.env` to enforce encrypted TLS 1.3 communication over the internet between the Laravel server and AWS Tokyo.

#### B. [`tests/Feature/DatabaseConnectionTest.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/tests/Feature/DatabaseConnectionTest.php#L1-L128)
- **Test 1 (Lines 17–21)**: Asserts `DB::connection()->getDriverName() === 'pgsql'`.
- **Test 2 (Lines 24–35)**: Runs `SELECT version()` and asserts modern PostgreSQL 17+ on Supabase Cloud.
- **Test 3 (Lines 38–66)**: Queries `pg_tables WHERE schemaname = 'public'` and asserts all 11 core tables exist.
- **Test 4 (Lines 69–99)**: Queries `pg_proc` and `pg_trigger` system catalogs to verify `fn_calculate_assessment_metrics`, `fn_audit_assessment_records`, `trg_assessment_records_before_insert_or_update`, and `trg_assessment_audit_logger` are compiled and attached.
- **Test 5 (Lines 102–127)**: Inserts a temporary school year (`2098-2099`) inside `DB::transaction()`, asserts the row count increased by `+1` inside the transaction, throws a `RuntimeException` to trigger rollback, and asserts the row count returned to `$initialCount` (proving ACID transaction atomicity and isolation).

---

## Part 4: "Understanding of Design Decisions" — Why, Trade-Offs & Alternatives (35% Weight)

Use the **What $\to$ Why $\to$ Alternative & Trade-Off** structure for every DBA question:

### 1. Why store `raw_scores` as JSON in PostgreSQL instead of a normalized `student_scores` child table?
- **What**: Stored the array of examinee raw scores (e.g., `[45, 42, 38, ...]`) in a `JSON` column on `assessment_records` alongside pre-computed `mean`, `mps`, and `sd`.
- **Why**: DNIHS consolidates performance at the *section/grade/school level* and does not store student PII (names/LRNs), ensuring compliance with the **Data Privacy Act of 2012 (RA 10173)**. Storing the score array on the assessment row allows atomic single-row writes and **zero-join reads**.
- **Alternative & Trade-off**: A separate `student_scores` table (1 row per student) would allow per-student longitudinal queries across quarters, **trade-off**: $40\times$ more rows (`~50,000+` rows per school year) and expensive `GROUP BY` / `JOIN` queries on every dashboard load.

### 2. Why use `ON DELETE RESTRICT` on `assessment_records(teacher_id)` and `sections(grade_level_id)` instead of `ON DELETE CASCADE`?
- **What**: Used `restrictOnDelete()` for parent entities that own historical academic data (`users`, `grade_levels`, `sections`), and used `cascadeOnDelete()` only for structural children (`role_user`, `terms`).
- **Why**: If a teacher leaves the school, `ON DELETE CASCADE` on `teacher_id` would silently delete all historical exam records encoded by that teacher, corrupting past school-year consolidation reports.
- **Alternative & Trade-off**: `ON DELETE SET NULL` would keep the assessment rows but erase authorship accountability (`teacher_id = NULL`). Instead, `ON DELETE RESTRICT` + soft deactivation (`users.is_active = false`) preserves 100% of historical grades and teacher attribution.

### 3. Why use a Partial Unique Index (`WHERE effective_until IS NULL`) on `teaching_assignments`?
- **What**: Created `CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique ON teaching_assignments (school_year_id, section_id, subject_id) WHERE effective_until IS NULL;`.
- **Why**: During the school year, a teacher may go on leave and be replaced by a substitute teacher. When the original teacher's load ends (`effective_until = '2025-11-15'`), the partial index ignores concluded rows and only enforces uniqueness among currently active assignments (`effective_until IS NULL`).
- **Alternative & Trade-off**: A standard `UNIQUE(school_year_id, section_id, subject_id)` constraint would block assigning a substitute teacher unless the previous teacher's assignment row was deleted (losing historical audit data).

### 4. Why drop the Foreign Key constraint on `assessment_audit_logs.assessment_id`?
- **What**: In migration `2026_10_22_000004`, we dropped `assessment_audit_logs_assessment_id_foreign` so `assessment_id` is stored as an unconstrained `BIGINT`.
- **Why**: `trg_assessment_audit_logger` fires `AFTER UPDATE OR DELETE ON assessment_records`. If an assessment record is ever hard-deleted, a foreign key with `CASCADE` would delete the audit log, and `SET NULL` would erase `OLD.id` (`assessment_id` would become `NULL`)!
- **Alternative & Trade-off**: Keeping a strict FK constraint guarantees referential existence for live rows, **trade-off**: it destroys forensic traceability for deleted rows. In forensic audit tables, preserving the historical `OLD.id` of deleted records is mandatory.

### 5. Why use a `BEFORE` trigger for metric calculation and an `AFTER` trigger for audit logging?
- **What**: `trg_assessment_records_before_insert_or_update` is a `BEFORE` trigger; `trg_assessment_audit_logger` is an `AFTER` trigger.
- **Why**: In PostgreSQL, modifying `NEW.*` columns (`NEW.mps := ...`) is only effective inside a `BEFORE` trigger before the tuple is written to the heap page. Conversely, audit logging must be an `AFTER` trigger so it only logs changes after all constraints and `BEFORE` triggers have succeeded.
- **Alternative & Trade-off**: Using an `AFTER` trigger to update `mps` would require executing a recursive `UPDATE assessment_records` statement (doubling disk I/O and risking infinite trigger recursion).

### 6. Why create `NOLOGIN` group roles (`dnihs_admin_role`, `dnihs_teacher_staff`) with Row-Level Security (RLS)?
- **What**: Created `dnihs_admin_role` and `dnihs_teacher_staff` with least-privilege `GRANT` statements and role-specific RLS policies on `assessment_records`.
- **Why**: **Defense-in-depth (Principle of Least Privilege)**. Even if a staff DB session or PostgREST client queries PostgreSQL directly, `dnihs_teacher_staff` is physically barred by the database engine from running `DELETE` on `assessment_records`, modifying `assessment_audit_logs`, or viewing soft-deleted rows (`USING (deleted_at IS NULL)`).
- **Alternative & Trade-off**: Relying *solely* on Laravel middleware (`EnsureUserHasRole`) protects HTTP endpoints, **trade-off**: provides zero protection against direct database/SQL client access or Supabase API exposure.

---

## Part 5: Applied "What If" or Live SQL/DBA Change Scenarios (15% Weight)

During the DBA individual questioning, the panel will test **Applied "What If" or Live Change (15%)** by asking you to write or modify a SQL query, index, constraint, trigger, or role privilege on the spot.

Here are **8 High-Probability Live DBA Changes** ready to type or sketch:

---

### Scenario 1: "What if we want the database trigger to also block negative `mean` or `sd` values?"
- **Where to go**: [`database/migrations/2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php#L45-L53) (Lines 45–53 inside `fn_calculate_assessment_metrics()`).
- **SQL to write**:
  ```sql
  IF NEW.mean < 0 OR NEW.sd < 0 THEN
      RAISE EXCEPTION 'mean and standard deviation cannot be negative';
  END IF;
  ```

---

### Scenario 2: "What if we also want `trg_assessment_audit_logger` to log `INSERT` operations in addition to `UPDATE` and `DELETE`?"
- **Where to go**: [`database/migrations/2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_21_132746_create_assessment_metrics_trigger_and_audit.php#L87-L155).
- **Step 1 (Add `ELSIF (TG_OP = 'INSERT')` inside `fn_audit_assessment_records()`)**:
  ```sql
  ELSIF (TG_OP = 'INSERT') THEN
      INSERT INTO assessment_audit_logs (
          assessment_id, action, new_mean, new_mps, new_sd,
          new_highest_score, new_lowest_score, new_no_of_entries,
          new_remarks, teacher_id, created_at
      ) VALUES (
          NEW.id, 'INSERT', NEW.mean, NEW.mps, NEW.sd,
          NEW.highest_score, NEW.lowest_score, NEW.no_of_entries,
          NEW.remarks, NEW.teacher_id, CURRENT_TIMESTAMP
      );
      RETURN NEW;
  ```
- **Step 2 (Update Trigger Event on Line 153)**:
  ```sql
  CREATE TRIGGER trg_assessment_audit_logger
  AFTER INSERT OR UPDATE OR DELETE ON assessment_records
  FOR EACH ROW EXECUTE FUNCTION fn_audit_assessment_records();
  ```

---

### Scenario 3: "What if we want to create a database-level `CHECK` constraint ensuring `term_number` in `terms` can only be 1, 2, or 3?"
- **SQL to write**:
  ```sql
  ALTER TABLE terms
  ADD CONSTRAINT terms_term_number_check
  CHECK (term_number IN (1, 2, 3));
  ```

---

### Scenario 4: "What if we want to create a Partial Unique Index on `school_years` so PostgreSQL itself guarantees only ONE school year can have `is_active = true`?"
- **SQL to write**:
  ```sql
  CREATE UNIQUE INDEX school_years_single_active_unique
  ON school_years (is_active)
  WHERE is_active = true AND deleted_at IS NULL;
  ```
  *(Explanation: Because `WHERE is_active = true` only indexes active rows, there can be many `false` rows, but only ONE `true` row in the entire table!)*

---

### Scenario 5: "What if we want to create a third PostgreSQL role called `dnihs_auditor_role` that can ONLY read `assessment_records` and `assessment_audit_logs`?"
- **Where to go**: [`database/migrations/2026_10_22_000003_configure_database_roles_and_rls.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/database/migrations/2026_10_22_000003_configure_database_roles_and_rls.php#L14-L43).
- **SQL to write**:
  ```sql
  CREATE ROLE dnihs_auditor_role NOLOGIN;
  GRANT USAGE ON SCHEMA public TO dnihs_auditor_role;
  GRANT SELECT ON assessment_records, assessment_audit_logs TO dnihs_auditor_role;

  CREATE POLICY p_audit_read_only
  ON assessment_audit_logs
  FOR SELECT
  TO dnihs_auditor_role
  USING (true);
  ```

---

### Scenario 6: "What if we want to index `assessment_audit_logs` by `assessment_id` and `created_at` for fast audit history lookups?"
- **SQL to write**:
  ```sql
  CREATE INDEX assessment_audit_logs_record_date_idx
  ON assessment_audit_logs (assessment_id, created_at DESC);
  ```

---

### Scenario 7: "What if we want to change the automated backup schedule from 2:00 AM daily to every Sunday at midnight?"
- **Where to go**: [`routes/console.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/routes/console.php#L345-L348) (Line 346).
- **Code to write**:
  ```php
  Schedule::command('db:backup')
      ->weeklyOn(0, '00:00') // 0 = Sunday at 00:00 midnight
      ->withoutOverlapping()
      ->runInBackground();
  ```

---

### Scenario 8: "What if the panel asks you to run an `EXPLAIN ANALYZE` query for a specific teacher's encoded assessments?"
- **Where to go**: [`scripts/run_benchmarks.php`](file:///c:/Users/acer/Documents/BSIT/m_capstone/scripts/run_benchmarks.php#L75-L82).
- **SQL to run**:
  ```sql
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id, section_id, subject_id, mean, mps, sd
  FROM assessment_records
  WHERE teacher_id = 1 AND school_year_id = 1 AND deleted_at IS NULL;
  ```

---

## Part 6: Clarity of Communication & Live Demo Command Cheat Sheet (15% Weight)

### 6.1 Live Terminal Commands to Keep Ready During DBA Defense

```powershell
# 1. Prove Laravel PostgreSQL 17.11 connection, 11 tables, PL/pgSQL triggers & ACID rollback:
.\vendor\bin\phpunit.bat tests\Feature\DatabaseConnectionTest.php

# 2. Prove live EXPLAIN (ANALYZE, BUFFERS) index speedup (-78.9% and -90.2% cost reduction):
php scripts/run_benchmarks.php

# 3. Prove live PostgreSQL backup generation with SHA-256 integrity hash:
php artisan db:backup

# 4. Prove database restore & 10-table row verification assertions:
php artisan db:restore --verify-only

# 5. Check all 20 migrations applied cleanly:
php artisan migrate:status
```

### 6.2 Golden Rules for Oral Defense Clarity (15% Weight)
1. **Answer with "Mechanism + Reason + Trade-Off"**:
   - *Bad answer*: *"We added an index on `assessment_records` to make it fast."*
   - *100% Excellent answer*: *"We created a 4-column B-Tree composite index `assess_records_consolidation_idx` on `(school_year_id, term_id, type, grade_level_id)`. We ordered `school_year_id` and `term_id` first to satisfy PostgreSQL's leftmost-prefix rule since those two filters are required on every consolidation query. In `EXPLAIN (ANALYZE, BUFFERS)`, this replaced a 29-buffer Sequential Scan with a 3-buffer Index Scan, reducing query cost by 78.9%. The trade-off is a negligible B-Tree pointer update on `INSERT`, which is ideal for our read-heavy analytical workload."*
2. **Never Guess When Unsure**: If asked an obscure PostgreSQL internal question you do not know, state honestly: *"I do not know that exact parameter off the top of my head, but I can check our migration or query `pg_catalog` to verify."*
