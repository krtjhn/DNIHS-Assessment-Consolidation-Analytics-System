# DNIHS Assessment Consolidation & Analytics Decision Support System (DSS)

An enterprise-grade, DepEd-aligned student assessment consolidation and analytics platform for tracking student learning mastery, calculating descriptive examination statistics (Mean, Standard Deviation, and Mean Percentage Score), and generating school-wide longitudinal performance reports.

---

## Table of Contents
1. [Academic Domain & System Overview](#1-academic-domain--system-overview)
2. [MVC Request Flow Architecture](#2-mvc-request-flow-architecture)
3. [Database Design, Normalization & Key Decisions](#3-database-design-normalization--key-decisions)
4. [Core Entities & CRUD Operations](#4-core-entities--crud-operations)
5. [Authentication & Role-Based Access Control (RBAC)](#5-authentication--role-based-access-control-rbac)
6. [Prerequisites & Clean Setup Guide](#6-prerequisites--clean-setup-guide)
7. [Automated Test Suite & Quality Verification](#7-automated-test-suite--quality-verification)
8. [Oral Defense & Evaluation Q&A Guide](#8-oral-defense--evaluation-qa-guide)

---

## 1. Academic Domain & System Overview

The system is designed for **Dayap Integrated National High School (DNIHS)** to resolve historical data fragmentation, manual tabulation errors, and time-consuming consolidation of Department of Education (DepEd) periodic examination results.

### Key Capabilities
- **DepEd 3-Term Academic Structure**: Strictly aligned with the 3-term academic calendar (`1st Term`, `2nd Term`, `3rd Term`) across Junior High School (`Grade 7` to `Grade 10`).
- **Standardized Curriculum Codes**: Each learning area is cataloged with standard codes (e.g., `MATH-7`, `SCI-8`, `ENG-9`, `FIL-10`, `AP-7`, `TLE-8`, `MAPEH-9`, `ESP-10`).
- **Automated Descriptive Statistics**: Real-time computation of examinee count ($N$), Arithmetic Mean ($\bar{x}$), Standard Deviation ($\sigma$), and Mean Percentage Score ($\text{MPS}$).
- **Mathematically Sound Pooled Consolidation**: Uses pooled population variance $\sigma^2_{\text{pooled}} = \frac{1}{N} \sum n_i (\sigma_i^2 + (\mu_i - \bar{\mu})^2)$ to accurately consolidate multiple sections across grade levels or school-wide cohorts without statistical error.
- **Official DepEd 7-Level Mastery Classification**:
  - **Mastered**: $\text{MPS} \ge 96.00\%$
  - **Closely Approximating Mastery**: $86.00\% \le \text{MPS} < 96.00\%$
  - **Moving Towards Mastery**: $66.00\% \le \text{MPS} < 86.00\%$
  - **Average**: $35.00\% \le \text{MPS} < 66.00\%$
  - **Low**: $15.00\% \le \text{MPS} < 35.00\%$
  - **Very Low**: $5.00\% \le \text{MPS} < 15.00\%$
  - **Absolutely No Mastery**: $\text{MPS} < 5.00\%$

---

## 2. MVC Request Flow Architecture

The application strictly implements the **Model-View-Controller (MVC)** architectural pattern combined with a modern decoupled Single Page Application (SPA) frontend.

```
+---------------------------------------------------------------------------------------------------------+
|                                           HTTP CLIENT (BROWSER)                                         |
|                           React 19 SPA (RecordEntry, PerformanceReport, Calendar)                       |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                            HTTP Request (JSON)
                                                     v
+---------------------------------------------------------------------------------------------------------+
| 1. ROUTING LAYER (routes/api.php & routes/web.php)                                                      |
|    - Maps URI endpoints to dedicated Controller actions using explicit [Controller::class, 'method']    |
|    - Route::fallback delegates unknown web routes gracefully to React SPA                               |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
| 2. MIDDLEWARE PIPELINE                                                                                  |
|    - TrustProxies: Configures reverse proxy / SSL termination                                           |
|    - auth:sanctum: Validates Bearer token and resolves authenticatable User entity                      |
|    - EnsureUserHasRole ('role:system_admin', 'role:teacher'): Enforces strict RBAC gates                |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
| 3. CONTROLLER & REQUEST VALIDATION LAYER (app/Http/Controllers/Api & app/Http/Requests)                 |
|    - FormRequests (StoreSectionRequest, StoreAssessmentRequest, etc.) validate incoming inputs           |
|    - Controllers coordinate business flow, prevent cross-grade mismatches, and authorize entity actions |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
| 4. SERVICE & MODEL LAYER (app/Services & app/Models)                                                    |
|    - StatsCalculatorService: Encapsulates pure mathematical statistics & mastery algorithms             |
|    - Eloquent Models (User, SchoolYear, Term, Section, Subject, TeachingAssignment, AssessmentRecord)  |
|    - Encapsulates schema relations, attribute type casting, query scopes, and SoftDeletes               |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                         SQL / Prepared Statements
                                                     v
+---------------------------------------------------------------------------------------------------------+
| 5. PERSISTENCE LAYER (PostgreSQL on Supabase)                                                           |
|    - Relational tables with foreign key constraints (RESTRICT / CASCADE)                                |
|    - Partial unique indexes, performance b-tree indexes, and JSONB document storage                     |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
| 6. RESPONSE / VIEW LAYER (app/Http/Resources & resources/views)                                         |
|    - API Resources (AssessmentRecordResource, SectionResource) transform and format outgoing payloads   |
|    - Blade View (welcome.blade.php) mounts client React root and injects assets                         |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Database Design, Normalization & Key Decisions

### Entity Relationship Model (ERD)

```
       +--------------------+
       |    school_years    |
       +--------------------+
         | 1            | 1
         |              |
         | *            | *
   +-----------+  +--------------+
   |   terms   |  |   sections   |
   +-----------+  +--------------+
         | 1            | 1
         |              |
         | *            | *
+------------------------------------+        +--------------------+
|         assessment_records         |--------|    grade_levels    |
+------------------------------------+ *    1 +--------------------+
   | *                            | *                   | 1
   |                              |                     |
   | 1                            | 1                   | *
+-------+             +-----------------------+   +--------------+
| users |-------------|  teaching_assignments |---|   subjects   |
+-------+ 1         * +-----------------------+ * +--------------+
   | *
   |
   | *
+-------+
| roles | (via role_user pivot)
+-------+
```

### Database Normalization Analysis
1. **First Normal Form (1NF)**:
   - Every column contains atomic values, with primary key `id` defined on every table.
   - Repeating groups are eliminated; student examination scores are stored in a native PostgreSQL JSON array attribute (`raw_scores`) accompanied by atomic computed statistics (`mean`, `sd`, `mps`, `highest_score`, `lowest_score`).
2. **Second Normal Form (2NF)**:
   - All tables possess single-column surrogate primary keys (`id`).
   - Every non-key attribute is fully functionally dependent on the entire primary key, eliminating partial dependencies.
3. **Third Normal Form (3NF)**:
   - Transitive dependencies are removed.
   - *Audit finding addressed*: The redundant `department` column was removed from `subjects` because in DepEd Junior High School, learning areas ("Mathematics", "Science", etc.) are identical to their subjects.
   - `subjects` relates directly to `grade_levels` (`grade_level_id`).
   - `sections` relates directly to `school_years` and `grade_levels`.

### Six Key Architectural Database Decisions
1. **PostgreSQL as Primary Database**:
   - Leveraged PostgreSQL on Supabase Cloud for ACID compliance, native JSON array querying, partial indexing, and strict schema referential integrity.
2. **Elimination of Redundant `department`**:
   - Dropped from `subjects` to satisfy 3NF. Added unique curriculum code `code` (e.g. `MATH-7`) for standardized external reporting and future Senior High School (SHS) curriculum expansion.
3. **Preservation of Grade-Specific Subjects (4 Grades $\times$ 8 Subjects = 32 Rows)**:
   - Kept explicit `grade_level_id` on each subject. This guarantees accurate grade-level filtering on the frontend and supports distinct learning competencies and future SHS tracks where subjects differ per grade.
4. **Partial Unique Index for Mid-Year Substitute Teachers**:
   - `CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique ON teaching_assignments (school_year_id, section_id, subject_id) WHERE effective_until IS NULL;`
   - Prevents duplicate active faculty assignments while allowing previous teachers to retain historical assignment audit records when substitutes take over.
5. **Multi-Year Data Retention via Soft Deletes**:
   - Added `softDeletes()` to `assessment_records`, `school_years`, `sections`, and `users`.
   - Protects multi-year cohort time-series analytics in the Decision Support System from accidental data wiping.
6. **Restrict-On-Delete for Historical Exam Integrity**:
   - Changed `assessment_records.teacher_id` constraint to `restrictOnDelete()`.
   - Prevents accidental hard-deletion of faculty accounts that own official historical examination records.

---

## 4. Core Entities & CRUD Operations

The system implements complete Create, Read, Update, and Delete (CRUD) operations across four core entities:

| Core Entity | Controller | HTTP Method & Route | Validation & Integrity Features |
| :--- | :--- | :--- | :--- |
| **Assessment Record** | `AssessmentController` | `POST /api/assessments`<br>`GET /api/assessments`<br>`GET /api/assessments/{id}`<br>`PUT /api/assessments/{id}`<br>`DELETE /api/assessments/{id}` | - Validates score range ($0 \le \text{score} \le \text{total\_items}$)<br>- Enforces section-to-grade match<br>- Enforces section-to-subject match<br>- Gated by active academic term calendar<br>- Auto-calculates Mean, SD, MPS, and Mastery |
| **Classroom Section** | `SectionController` | `POST /api/sections`<br>`GET /api/sections`<br>`GET /api/sections/{id}`<br>`PUT /api/sections/{id}`<br>`DELETE /api/sections/{id}` | - FormRequest: `StoreSectionRequest`<br>- Composite unique name per grade and year<br>- Referential guard: Blocks deletion if assessments exist |
| **School Year & Term** | `SchoolYearController`<br>`TermController` | `POST /api/school-years`<br>`GET /api/school-years`<br>`PUT /api/school-years/{id}`<br>`DELETE /api/school-years/{id}`<br>`PATCH /api/terms/{id}/status` | - FormRequest: `StoreSchoolYearRequest`<br>- Auto-generates 3 DepEd terms upon creation<br>- Auto-completes previous active term<br>- Blocks deletion of active school years |
| **Teaching Assignment** | `TeacherAssignmentController` | `POST /api/teaching-assignments`<br>`POST /api/teaching-assignments/sync`<br>`GET /api/teaching-assignments`<br>`DELETE /api/teaching-assignments/{id}` | - FormRequest: `StoreTeachingAssignmentRequest`<br>- Partial unique index prevents workload collision<br>- Atomic transaction batch synchronization |

---

## 5. Authentication & Role-Based Access Control (RBAC)

Authentication is handled via **Laravel Sanctum** token-based authorization.

### User Account Lifecycle
```
Self-Registration (POST /api/auth/register)
                  |
                  v
       Status: 'pending', is_active: false
                  |
                  +--------------------------------+
                  |                                |
         [Admin Approves]                 [Admin Rejects]
                  |                                |
                  v                                v
 Status: 'approved', is_active: true     Status: 'rejected', is_active: false
         (Can log in & encode)                 (Login blocked HTTP 403)
```

### RBAC Permission Matrix

| Feature / Endpoint | Public | Teacher (`role:teacher`) | System Administrator (`role:system_admin`) |
| :--- | :---: | :---: | :---: |
| `POST /api/auth/login` | Yes | Yes | Yes |
| `POST /api/auth/register` | Yes | Yes | Yes |
| `GET /api/my-classes` | No | Own assigned classes | All classes |
| `POST /api/assessments` | No | Assigned section/subject only | Any section/subject |
| `PUT /api/assessments/{id}` | No | Own records only | Any record |
| `DELETE /api/assessments/{id}` | No | Own records only | Any record |
| `GET /api/assessments/consolidation` | No | Yes (Filtered) | Yes (School-Wide) |
| `POST /api/school-years` | No | Forbidden (403) | Yes |
| `PATCH /api/terms/{id}/status` | No | Forbidden (403) | Yes |
| `POST /api/sections` | No | Forbidden (403) | Yes |
| `POST /api/teachers` | No | Forbidden (403) | Yes |
| `PATCH /api/teachers/{id}/approve` | No | Forbidden (403) | Yes |
| `POST /api/teaching-assignments/sync` | No | Forbidden (403) | Yes |

---

## 6. Prerequisites & Clean Setup Guide

### System Prerequisites
- **PHP**: 8.2 or 8.3+ with `pdo_pgsql`, `openssl`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`
- **Composer**: 2.x
- **Node.js**: 20+ & npm 10+
- **Database**: PostgreSQL 15+ (local or Supabase Cloud)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd m_capstone

# Install PHP dependencies
composer install

# Install frontend JavaScript dependencies
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
php artisan key:generate
```

Configure your `.env` connection parameters:
```env
DB_CONNECTION=pgsql
DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.your-ref
DB_PASSWORD=your-secure-password
DB_SSLMODE=require
```

### 3. Fresh Migration & Seeding
```bash
# Rebuild the entire database schema from scratch and seed default reference data
php artisan migrate:fresh --seed
```

### 4. Default Seeded Accounts for Testing & Defense

| Role | Email | Password | Status | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@gmail.com` | `password` | Approved | Full administrative access |
| **Faculty (Teacher 1)** | `maria.santos@gmail.com` | `password` | Approved | Assigned to Grade 7 sections |
| **Faculty (Teacher 2)** | `juan.delacruz@gmail.com` | `password` | Approved | Assigned to Grade 8 sections |

### 5. Launch Development Servers
```bash
# Terminal 1: Backend API server
php artisan serve

# Terminal 2: Vite frontend asset compiler
npm run dev
```

---

## 7. Automated Test Suite & Quality Verification

The repository includes a comprehensive, 100% passing automated test suite:

```bash
php vendor/bin/phpunit
```

### Test Coverage Summary (39 Tests, 157 Assertions)
- `Tests\Feature\AuthAndRoleTest`: 6 tests, 26 assertions (Sanctum authentication, role assignment, registration approval gate).
- `Tests\Feature\TeacherAssignmentTest`: 5 tests, 18 assertions (Workload allocation, partial unique index, substitute teacher support, bulk sync).
- `Tests\Feature\SchoolYearAndTermTest`: 5 tests, 18 assertions (Academic calendar creation, 3-term generation, period locking, soft deletes).
- `Tests\Feature\TeacherAccountTest`: 9 tests, 50 assertions (Registration, approval workflow, administrator provisioning, soft-revoke/reactivate).
- `Tests\Feature\AssessmentAndSectionTest`: 6 tests, 25 assertions (Descriptive statistics computation, score bounds checking, cross-grade mismatch rejection, referential deletion guards).
- `Tests\Feature\AssessmentOwnershipTest`: 6 tests, 18 assertions (Teacher record isolation, cross-teacher overwrite prevention, administrator override, consolidated reporting).
- `Tests\Unit\ExampleTest` & `Tests\Feature\ExampleTest`: 2 baseline tests, 2 assertions.

---

## 8. Oral Defense & Evaluation Q&A Guide

### Q1: "How does the request flow through the MVC architecture in your system?"
> **Answer**: When a user submits an assessment or interacts with the system, the HTTP request is sent from the React 19 frontend to Laravel's router in `routes/api.php`. The request first passes through the middleware pipeline: `auth:sanctum` validates the bearer token, and `EnsureUserHasRole` verifies role authorization (`system_admin` or `teacher`). The controller (`AssessmentController`) intercepts the request and validates the payload using rules that verify score limits and grade-level consistency. The controller delegates mathematical calculations to `StatsCalculatorService` and invokes Eloquent Models (`AssessmentRecord`) to interact with PostgreSQL using prepared statements. Finally, an API Resource (`AssessmentRecordResource`) formats the response and returns a structured JSON payload to the React view.

### Q2: "Is your database normalized? How did you justify your normalization decisions?"
> **Answer**: Yes, the database conforms to Third Normal Form (3NF). Every entity has atomic attributes and a unique primary key (1NF). All non-key attributes depend entirely on the primary key without partial dependencies (2NF). We removed the redundant `department` field from the `subjects` table because it was identical to the subject name in Junior High School, removing transitive dependency (3NF). We also designed `role_user` as a normalized junction table. Furthermore, we made a key architectural decision to store student raw scores as a JSON array inside `assessment_records` alongside precalculated summary statistics, preventing millions of low-cardinality rows while utilizing PostgreSQL's native JSONB indexing.

### Q3: "How does your database handle substitute teachers or teacher turnover mid-year?"
> **Answer**: In a typical database, a standard unique constraint on `(school_year_id, section_id, subject_id)` prevents assigning a new teacher if the original teacher leaves or goes on leave. In our system, we implemented a PostgreSQL **partial unique index**:
> `CREATE UNIQUE INDEX ... WHERE effective_until IS NULL;`
> This ensures that only **one active teacher** can be assigned to a section and subject at any given time, while allowing previous teachers to have historical assignment records (`effective_until` timestamp populated) for complete auditability.

### Q4: "How does your system prevent corrupted or lost historical data over multiple school years?"
> **Answer**: We instituted three levels of protection:
> 1. **Soft Deletes**: Implemented across `assessment_records`, `school_years`, `sections`, and `users` so records can be deactivated without deleting historical cohort data.
> 2. **Restrict on Delete**: Foreign keys linking `assessment_records` to teachers and sections use `restrictOnDelete()`, preventing accidental cascading deletion.
> 3. **Cross-Grade Validation**: The backend strictly validates that `section.grade_level_id === subject.grade_level_id`, preventing accidental entry of a Grade 8 subject score sheet under a Grade 7 section.

### Q5: "Why did you use pooled variance for school-wide consolidation instead of averaging the standard deviations?"
> **Answer**: Averaging standard deviations ($\frac{\sigma_1 + \sigma_2}{2}$) is a well-known mathematical fallacy because standard deviation is non-linear. Our `StatsCalculatorService` calculates the true **pooled population variance**:
> $$\sigma^2_{\text{pooled}} = \frac{1}{N} \sum_{i=1}^{k} n_i \left(\sigma_i^2 + (\mu_i - \bar{\mu})^2\right)$$
> This correctly accounts for both the **within-group variance** and the **between-group dispersion** across sections, providing mathematically accurate decision support metrics.

---

## 9. License

This project is developed for academic capstone presentation and institutional deployment at Dayap Integrated National High School (DNIHS).
