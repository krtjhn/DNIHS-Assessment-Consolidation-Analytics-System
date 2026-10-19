# DNIHS Assessment Consolidation & Analytics Decision Support System (DSS)

An enterprise-grade, DepEd-aligned student assessment consolidation and analytics platform engineered for Dayap Integrated National High School (DNIHS). The platform tracks student learning mastery, computes descriptive examination statistics (Arithmetic Mean, Standard Deviation, and Mean Percentage Score), provides mathematically rigorous cohort consolidation via pooled variance, and powers administrative decision-making through automated performance analytics.

---

## Table of Contents
1. [Academic Domain & System Overview](#1-academic-domain--system-overview)
2. [MVC & Decoupled Architecture](#2-mvc--decoupled-architecture)
3. [Core System Features & Modules](#3-core-system-features--modules)
4. [Statistical & Mathematical Calculation Engine](#4-statistical--mathematical-calculation-engine)
5. [Database Architecture & Schema Design](#5-database-architecture--schema-design)
6. [Database Normalization Analysis](#6-database-normalization-analysis)
7. [Authentication, Authorization & RBAC](#7-authentication-authorization--rbac)
8. [Comprehensive RESTful API Reference](#8-comprehensive-restful-api-reference)
9. [Automated Test Suite & Verification](#9-automated-test-suite--verification)
10. [Oral Defense & Evaluation Q&A Guide](#10-oral-defense--evaluation-qa-guide)

---

## 1. Academic Domain & System Overview

### Institutional Background
At Dayap Integrated National High School (DNIHS), periodic examinations across Junior High School (Grades 7 through 10) have traditionally relied on manual computation and spreadsheet-based reporting. This workflow introduced significant administrative challenges:
- Manual tabulation errors in calculating Mean, Standard Deviation, and Mean Percentage Score (MPS).
- Fragmented records across individual faculty spreadsheets, making school-wide consolidation slow and prone to transcription errors.
- Statistically invalid consolidation methods (such as directly averaging standard deviations across sections of differing sizes).
- Delayed identification of learning competencies where students scored lowest, delaying targeted remedial intervention.

### Platform Objectives
The DNIHS Assessment Consolidation & Analytics Decision Support System resolves these challenges through a centralized, automated web platform:
- **Standardized Academic Calendar**: Adheres strictly to the Department of Education (DepEd) 3-term academic structure (`1st Term`, `2nd Term`, `3rd Term`) across Grades 7, 8, 9, and 10.
- **Curriculum Standardization**: Manages standard DepEd Junior High School learning areas (Filipino, English, Mathematics, Science, Araling Panlipunan, TLE, MAPEH, and Edukasyon sa Pagpapakatao) with grade-specific curriculum codes (e.g., `MATH-7`, `SCI-8`).
- **Real-Time Automated Statistics**: Instant calculation of examinee count ($N$), Mean ($\bar{x}$), Standard Deviation ($\sigma$), Mean Percentage Score ($\text{MPS}$), and DepEd verbal mastery descriptors upon score entry.
- **Statistically Rigorous Consolidation**: Consolidates assessment results across sections, grade levels, and the entire institution using pooled population variance to eliminate mathematical errors inherent in naive averaging.
- **Competency Gap Tracking**: Captures and aggregates least learned competencies to inform instructional adjustments and curriculum interventions.

---

## 2. MVC & Decoupled Architecture

The application adopts the **Model-View-Controller (MVC)** architectural pattern, deployed as a decoupled system featuring a high-performance RESTful API backend built on Laravel 11 and an interactive Single Page Application (SPA) frontend built with React 19.

### Architecture Flowchart

```
+---------------------------------------------------------------------------------------------------+
|                                      CLIENT LAYER (BROWSER)                                       |
|             React 19 Single Page Application (Tailwind CSS, Material Design, Apple HIG)           |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                         HTTPS / JSON Payload
                                         (Bearer Authorization)
                                                  v
+---------------------------------------------------------------------------------------------------+
| 1. ROUTING & ENTRY LAYER (routes/api.php & routes/web.php)                                        |
|    - Maps URI patterns to explicit Controller action tuples: [Controller::class, 'method']       |
|    - Root web route (/) serves active JSON status for API health probes                          |
|    - Fallback handler delivers uniform JSON 404 responses for invalid endpoints                  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 2. HTTP MIDDLEWARE PIPELINE                                                                       |
|    - Cors: Handles pre-flight OPTIONS requests and validates allowed Vercel origins               |
|    - TrustProxies: Configures reverse proxy headers and terminates TLS                            |
|    - auth:sanctum: Validates personal access bearer tokens; resolves authenticatable User entity  |
|    - EnsureUserHasRole: Restricts endpoint access using RBAC parameters ('role:system_admin', etc)|
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 3. REQUEST VALIDATION LAYER (app/Http/Requests)                                                   |
|    - StoreAssessmentRequest, UpdateAssessmentRequest                                              |
|    - StoreSectionRequest, UpdateSectionRequest                                                    |
|    - StoreSchoolYearRequest, UpdateSchoolYearRequest, UpdateTermStatusRequest                     |
|    - StoreTeachingAssignmentRequest, SyncTeachingAssignmentRequest                               |
|    - StoreTeacherRequest, LoginRequest, RegisterRequest                                           |
|    - Sanitizes input types, validates foreign key existence, and enforces business constraints    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 4. CONTROLLER LAYER (app/Http/Controllers/Api)                                                    |
|    - AssessmentController: Manages score sheets, cross-teacher overwrite guards, and reports      |
|    - AuthController: Handles registration approval status, login token issuance, and sessions     |
|    - TeacherController: Manages faculty directory, approvals, deactivations, and reactivations    |
|    - TeacherAssignmentController: Manages class assignments, workload matrix, and batch syncing   |
|    - SchoolYearController & TermController: Oversees academic calendar cycles and period locking  |
|    - SectionController: Controls classroom sections and enforces referential deletion guards     |
|    - AcademicReferenceController: Serves cached grade levels, subjects, and active school year   |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 5. DOMAIN SERVICE LAYER (app/Services)                                                            |
|    - StatsCalculatorService: Pure mathematical computation engine:                               |
|      * Arithmetic Mean, Standard Deviation, Mean Percentage Score (MPS)                           |
|      * DepEd 7-Bracket Verbal Mastery Classification                                              |
|      * Multi-section pooled population variance and weighted group consolidation                  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 6. PERSISTENCE & ORM LAYER (app/Models)                                                           |
|    - Eloquent ORM Models: User, Role, SchoolYear, Term, GradeLevel, Section, Subject,             |
|      TeachingAssignment, AssessmentRecord                                                         |
|    - Schema relationships, eager loading scopes (with, withCount), SoftDeletes, and casts        |
|    - Executes prepared SQL statements against PostgreSQL on Supabase Cloud                        |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 7. API RESOURCE SERIALIZATION LAYER (app/Http/Resources)                                          |
|    - AssessmentRecordResource, SectionResource, TeachingAssignmentResource, UserResource         |
|    - Formats outgoing JSON responses, strips internal identifiers, and guarantees schema shape    |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Core System Features & Modules

### 3.1 Faculty Score Sheet & Assessment Encoding
- **Class-Scoped Access**: Teachers access only the classes assigned to them via the `GET /api/my-classes` endpoint. Results are cached per teacher and school year for 300 seconds to minimize redundant queries.
- **Interactive Score Entry**: Accepts raw numeric scores ($0 \le \text{score} \le \text{total\_items}$) for each student in a section.
- **Real-Time Statistics Generation**: When raw scores are submitted, `AssessmentController` invokes `StatsCalculatorService` within a database transaction. The system computes and stores:
  - Number of valid examinees ($N$)
  - Arithmetic Mean ($\bar{x}$)
  - Mean Percentage Score ($\text{MPS}$)
  - Population Standard Deviation ($\sigma$)
  - Highest Score and Lowest Score
  - Official DepEd Mastery Level Descriptor
- **Least Learned Competency Tracking**: Accepts optional competency identifiers or descriptions highlighting areas where students struggled, enabling curriculum leads to review learning deficiencies.
- **Cross-Teacher Overwrite Protection**: The system prevents a faculty member from overwriting a score sheet already encoded by another teacher for the same section, subject, term, and examination type. Only administrators possess override authority.
- **Academic Calendar Period Locking**: Score creation, updating, and deletion are gated by the status of the academic term. If a term is marked as `completed` or `pending`, or if the parent school year is inactive, modifications are rejected with HTTP 422 to preserve historical audit integrity.

### 3.2 Decision Support System (DSS) Consolidation & Analytics
- **Multi-Level Consolidation**: The `GET /api/assessments/consolidation` endpoint aggregates assessment records across three selectable scopes:
  1. Section-level performance comparisons within a subject.
  2. Grade-level aggregate performance across all sections.
  3. School-wide performance summaries for institutional evaluation.
- **Pooled Population Variance**: Unlike naive spreadsheet approaches that average standard deviations, the backend implements pooled population variance to account for both within-group and between-group dispersion.
- **Composite Consolidation Indexing**: Backed by a dedicated composite database index on `assessment_records (school_year_id, term_id, type, grade_level_id)` to ensure sub-second query performance even under high record volume.

### 3.3 Academic Calendar & Term Lifecycle
- **Automated Term Generation**: When an administrator creates a new school year via `POST /api/school-years`, the system automatically provisions the three standard DepEd terms (`1st Term`, `2nd Term`, `3rd Term`) in a `pending` state within an atomic transaction.
- **Active Year Singularity**: Activating a school year automatically deactivates all other school years in the system, ensuring that only one academic year remains active at any time.
- **Sequential Term Activation**: Setting a term status to `active` automatically marks all other active terms in that school year as `completed`, preventing simultaneous open recording windows.
- **Deletion Guards**: A school year cannot be deleted if sections or assessment records are linked to it. Active school years cannot be deleted until deactivated.

### 3.4 Classroom Section Management
- **Grade-Level Association**: Every section belongs to a defined grade level (Grade 7, 8, 9, or 10) and school year.
- **Composite Uniqueness**: Sections enforce unique naming per grade level and school year, preventing duplicate section rosters.
- **Referential Deletion Protection**: A section containing recorded assessment scores cannot be deleted. The API returns HTTP 422 with an explicit instruction to preserve historical assessment data.

### 3.5 Faculty Workload Matrix & Mid-Year Reassignment
- **Workload Allocation**: Administrators assign faculty members to specific section-subject pairs for an active school year.
- **Conflict Prevention**: If a class is already assigned to another teacher, the system blocks duplicate active assignments.
- **Batch Workload Synchronization**: The `POST /api/teaching-assignments/sync` endpoint enables administrators to sync all assigned classes for a teacher in a single request. Dropped classes are closed by populating `effective_until = now()`, while new classes are inserted in a single batch.
- **Substitute Teacher Support**: Uses a PostgreSQL partial unique index (`WHERE effective_until IS NULL`). When a teacher takes leave, their assignment is concluded with an end date, allowing a substitute teacher to be assigned to the same class while preserving historical audit trails.

### 3.6 Faculty Account Lifecycle & Registration Approval
- **Self-Registration Pipeline**: Prospective teachers register via `POST /api/auth/register`. Newly registered accounts are created with `approval_status = 'pending'` and `is_active = false`.
- **Administrative Approval Gate**: The system administrator reviews pending applications via `GET /api/teachers?include_inactive=true`.
  - **Approve** (`PATCH /api/teachers/{id}/approve`): Sets `approval_status = 'approved'`, `is_active = true`, sets `approved_at = now()`, and grants login access.
  - **Reject** (`PATCH /api/teachers/{id}/reject`): Sets `approval_status = 'rejected'`, permanently blocking login access.
- **Direct Provisioning**: Administrators can bypass self-registration by creating pre-approved, active faculty accounts directly via `POST /api/teachers`.
- **Safe Account Deactivation**: Deactivating a teacher via `DELETE /api/teachers/{id}` does not delete database rows. It concludes all active teaching assignments, revokes all active Sanctum tokens, and sets `is_active = false`. Historical assessment records remain intact.
- **Account Reactivation**: Inactive teachers can be restored at any time via `PATCH /api/teachers/{id}/reactivate`.

---

## 4. Statistical & Mathematical Calculation Engine

All descriptive statistics and consolidation calculations are encapsulated within `App\Services\StatsCalculatorService`.

### 4.1 Section-Level Descriptive Statistics

Given a set of valid numeric scores $X = \{x_1, x_2, \dots, x_n\}$ where $n \ge 1$ and a test item count $T > 0$:

#### 1. Arithmetic Mean ($\bar{x}$)
$$\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i$$
Rounded to 2 decimal places.

#### 2. Mean Percentage Score ($\text{MPS}$)
The DepEd standard metric representing the percentage of test items answered correctly on average:
$$\text{MPS} = \left( \frac{\bar{x}}{T} \right) \times 100$$
Rounded to 2 decimal places.

#### 3. Population Variance ($\sigma^2$) & Population Standard Deviation ($\sigma$)
The system computes the population standard deviation (dividing by $n$, not $n-1$) because the score sheet represents the complete population of examinees present during the assessment:
$$\sigma^2 = \frac{1}{n} \sum_{i=1}^{n} (x_i - \bar{x})^2$$
$$\sigma = \sqrt{\sigma^2} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (x_i - \bar{x})^2}$$
Rounded to 2 decimal places.

#### 4. Extremes (Highest & Lowest Scores)
$$\text{High} = \max(x_1, x_2, \dots, x_n), \quad \text{Low} = \min(x_1, x_2, \dots, x_n)$$

---

### 4.2 Official DepEd 7-Bracket Mastery Classification Scale

The system maps the computed $\text{MPS}$ to the official DepEd 7-level mastery verbal interpretation:

| MPS Range | DepEd Verbal Interpretation | Academic Meaning & Action Guidance |
| :---: | :--- | :--- |
| **$96.00\% - 100.00\%$** | **Mastered** | Outstanding learning mastery. Students demonstrate comprehensive command of learning competencies. |
| **$86.00\% - 95.99\%$** | **Closely Approximating Mastery** | High level of competence. Minimal enrichment needed. |
| **$66.00\% - 85.99\%$** | **Moving Towards Mastery** | Satisfactory progress. Core competencies understood with minor conceptual gaps. |
| **$35.00\% - 65.99\%$** | **Average** | Moderate learning retention. Requires targeted review of least learned competencies. |
| **$15.00\% - 34.99\%$** | **Low** | Significant learning deficits. Targeted remedial instruction required. |
| **$5.00\% - 14.99\%$** | **Very Low** | Severe learning deficiencies. Intensive intervention and fundamental re-teaching required. |
| **$0.00\% - 4.99\%$** | **Absolutely No Mastery** | Critical learning failure. Comprehensive diagnostic evaluation and intervention required. |

---

### 4.3 Multi-Section Pooled Consolidation Algorithm

A frequent error in educational data systems is calculating overall standard deviation by taking the arithmetic average of individual section standard deviations:
$$\sigma_{\text{invalid}} = \frac{\sigma_1 + \sigma_2 + \dots + \sigma_k}{k} \quad \text{(Statistically Incorrect)}$$

This is mathematically false because standard deviations are non-linear, and direct averaging ignores differences in section sizes ($n_i$) as well as the dispersion between section means.

#### The Pooled Population Variance Method
When consolidating $k$ sections with examinee counts $n_1, n_2, \dots, n_k$, section means $\bar{x}_1, \bar{x}_2, \dots, \bar{x}_k$, and section standard deviations $\sigma_1, \sigma_2, \dots, \sigma_k$:

1. **Total Examinees ($N$)**:
   $$N = \sum_{i=1}^{k} n_i$$

2. **Overall Weighted Mean ($\bar{\mu}$)**:
   $$\bar{\mu} = \frac{1}{N} \sum_{i=1}^{k} n_i \bar{x}_i$$

3. **Overall Weighted MPS ($\text{MPS}_{\text{overall}}$)**:
   $$\text{MPS}_{\text{overall}} = \frac{1}{N} \sum_{i=1}^{k} n_i \text{MPS}_i$$

4. **Pooled Population Variance ($\sigma^2_{\text{pooled}}$)**:
   By the law of total variance, pooled variance consists of two components:
   - **Within-group variance**: $\sigma_i^2$ weighted by $n_i$
   - **Between-group variance**: $(\bar{x}_i - \bar{\mu})^2$ weighted by $n_i$

   $$\sigma^2_{\text{pooled}} = \frac{1}{N} \sum_{i=1}^{k} n_i \left( \sigma_i^2 + (\bar{x}_i - \bar{\mu})^2 \right)$$

5. **Overall Consolidated Standard Deviation ($\sigma_{\text{overall}}$)**:
   $$\sigma_{\text{overall}} = \sqrt{\sigma^2_{\text{pooled}}}$$

`StatsCalculatorService` evaluates this algorithm in a single, high-efficiency pass over the record collection, delivering mathematically sound consolidation metrics for institutional reporting.

---

## 5. Database Architecture & Schema Design

The relational database runs on **PostgreSQL (Supabase Cloud)**. The schema leverages strict foreign key constraints, partial unique indexes, performance b-tree indexes, and soft deletes.

### 5.1 Entity Relationship Diagram (ERD)

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

---

### 5.2 Schema Specification by Table

#### 1. `users`
Stores user authentication credentials, account state, and registration approval information.

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique user identifier |
| `name` | `varchar(255)` | Not Null | Full legal name of user |
| `email` | `varchar(255)` | Unique, Not Null | Unique login email address |
| `email_verified_at` | `timestamp` | Nullable | Email verification timestamp |
| `password` | `varchar(255)` | Not Null | Bcrypt hashed password |
| `is_active` | `boolean` | Default: `true` | Login authorization flag |
| `approval_status` | `varchar(50)` | Default: `'approved'` | Status: `'pending'`, `'approved'`, `'rejected'` |
| `approved_at` | `timestamp` | Nullable | Timestamp of administrative approval |
| `remember_token` | `varchar(100)` | Nullable | Remember me token |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |
| `deleted_at` | `timestamp` | Nullable | Soft delete timestamp |

- **Indexes**:
  - `users_email_unique` (`email`)
  - `users_approval_status_idx` (`approval_status`)

---

#### 2. `roles` & `role_user`
Implements normalized Many-to-Many Role-Based Access Control.

- **`roles` Table**:
  - `id` (`bigint`, PK)
  - `name` (`varchar(255)`, Unique) — e.g., `'system_admin'`, `'teacher'`
  - `description` (`varchar(255)`, Nullable)
- **`role_user` Table (Pivot)**:
  - `user_id` (`bigint`, FK $\to$ `users.id` on delete cascade)
  - `role_id` (`bigint`, FK $\to$ `roles.id` on delete cascade)
  - Composite Primary Key: `(user_id, role_id)`

---

#### 3. `school_years`
Defines academic years (e.g., "2025-2026").

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique school year ID |
| `name` | `varchar(255)` | Unique, Not Null | Academic year label (e.g., "2025-2026") |
| `start_date` | `date` | Not Null | Official opening date of academic year |
| `end_date` | `date` | Not Null | Official closing date of academic year |
| `is_active` | `boolean` | Default: `false` | Global active status flag |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |
| `deleted_at` | `timestamp` | Nullable | Soft delete timestamp |

- **Indexes**:
  - `school_years_is_active_idx` (`is_active`)

---

#### 4. `terms`
Represents the DepEd 3-term academic divisions within each school year.

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique term ID |
| `school_year_id` | `bigint` | FK $\to$ `school_years.id` on delete cascade | Parent school year |
| `term_number` | `smallint` | Not Null, In: `[1, 2, 3]` | Term index (1, 2, or 3) |
| `name` | `varchar(255)` | Not Null | Display name (e.g., "1st Term", "2nd Term") |
| `status` | `varchar(50)` | Default: `'pending'` | Status: `'pending'`, `'active'`, `'completed'` |
| `start_date` | `date` | Nullable | Term start date |
| `end_date` | `date` | Nullable | Term end date |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |

- **Indexes**:
  - Unique constraint on `(school_year_id, term_number)`

---

#### 5. `grade_levels`
Catalog of supported Junior High School grade levels.

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique grade level ID |
| `level` | `smallint` | Unique, In: `[7, 8, 9, 10]` | Numeric grade level (7, 8, 9, 10) |
| `name` | `varchar(255)` | Not Null | Display name (e.g., "Grade 7") |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |

---

#### 6. `subjects`
Catalog of DepEd Junior High School learning areas.

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique subject ID |
| `grade_level_id` | `bigint` | FK $\to$ `grade_levels.id` on delete cascade | Grade level offering this subject |
| `name` | `varchar(255)` | Not Null | Subject title (e.g., "Mathematics") |
| `code` | `varchar(50)` | Nullable | Standard curriculum code (e.g., `MATH-7`) |
| `is_active` | `boolean` | Default: `true` | Active status flag |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |

- **Design Decision**: Each grade level has 8 dedicated subject records ($4 \text{ grades} \times 8 \text{ learning areas} = 32 \text{ rows}$), enabling grade-specific curriculum code indexing (`MATH-7`, `MATH-8`) and distinct learning competencies.

---

#### 7. `sections`
Classroom cohorts organized under grade levels and school years.

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique section ID |
| `school_year_id` | `bigint` | FK $\to$ `school_years.id` on delete cascade | Academic year |
| `grade_level_id` | `bigint` | FK $\to$ `grade_levels.id` on delete cascade | Assigned grade level |
| `name` | `varchar(255)` | Not Null | Section name (e.g., "Rizal", "Bonifacio") |
| `is_active` | `boolean` | Default: `true` | Active status flag |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |
| `deleted_at` | `timestamp` | Nullable | Soft delete timestamp |

- **Indexes**:
  - `sections_grade_level_id_idx` (`grade_level_id`)
  - Composite Unique constraint on `(school_year_id, grade_level_id, name)`

---

#### 8. `teaching_assignments`
Maps faculty members to assigned section-subject classes.

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique assignment ID |
| `user_id` | `bigint` | FK $\to$ `users.id` on delete cascade | Assigned faculty member |
| `school_year_id` | `bigint` | FK $\to$ `school_years.id` on delete cascade | School year of assignment |
| `section_id` | `bigint` | FK $\to$ `sections.id` on delete cascade | Assigned section |
| `subject_id` | `bigint` | FK $\to$ `subjects.id` on delete cascade | Assigned subject |
| `effective_from` | `date` | Not Null | Assignment start date |
| `effective_until` | `date` | Nullable | Assignment end date (populated on reassign) |
| `assigned_by` | `bigint` | FK $\to$ `users.id` on delete set null | Administrator who provisioned the load |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |

- **PostgreSQL Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique
  ON teaching_assignments (school_year_id, section_id, subject_id)
  WHERE effective_until IS NULL;
  ```
  *Technical Rationale*: Guarantees that at any single point in time, only **one active teacher** can be assigned to a section and subject, while simultaneously allowing historical assignments (`effective_until` not null) to persist when substitute teachers take over.

---

#### 9. `assessment_records`
Stores student examination score sheets, precomputed statistics, and least learned competencies.

| Column | Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | Primary Key, Auto Increment | Unique assessment record ID |
| `school_year_id` | `bigint` | FK $\to$ `school_years.id` on delete cascade | Academic year |
| `term_id` | `bigint` | FK $\to$ `terms.id` on delete cascade | Academic term |
| `grade_level_id` | `bigint` | FK $\to$ `grade_levels.id` on delete cascade | Grade level |
| `section_id` | `bigint` | FK $\to$ `sections.id` on delete restrict | Classroom section |
| `subject_id` | `bigint` | FK $\to$ `subjects.id` on delete cascade | Learning area |
| `teacher_id` | `bigint` | FK $\to$ `users.id` on delete restrict | Faculty member who encoded the scores |
| `type` | `varchar(50)` | Not Null, Default: `'term_exam'` | Assessment type (`diagnostic`, `term_exam`) |
| `total_items` | `integer` | Not Null, Default: `50` | Total examination test items |
| `raw_scores` | `json` / `jsonb` | Not Null | Array of numeric student scores |
| `no_of_entries` | `integer` | Not Null | Total number of valid examinees ($N$) |
| `mean` | `decimal(5,2)` | Not Null | Computed Arithmetic Mean ($\bar{x}$) |
| `mps` | `decimal(5,2)` | Not Null | Computed Mean Percentage Score ($\text{MPS}$) |
| `sd` | `decimal(5,2)` | Not Null | Computed Standard Deviation ($\sigma$) |
| `highest_score` | `decimal(5,2)` | Not Null | Maximum score in examination |
| `lowest_score` | `decimal(5,2)` | Not Null | Minimum score in examination |
| `least_learned_competency` | `text` | Nullable | Specific competency where students struggled |
| `remarks` | `varchar(255)` | Default: `'Complete'` | Submission remarks |
| `created_at` / `updated_at` | `timestamp` | Nullable | Standard audit timestamps |
| `deleted_at` | `timestamp` | Nullable | Soft delete timestamp |

- **Foreign Key Guard (`restrictOnDelete`)**:
  - `teacher_id` uses `restrictOnDelete()` instead of `cascadeOnDelete()`. A faculty member account cannot be hard-deleted if they own official historical examination records.
- **Indexes**:
  - Composite Unique Index on `(school_year_id, term_id, section_id, subject_id, type)`
  - Composite Reporting Index on `(school_year_id, term_id, type, grade_level_id)` named `assess_records_consolidation_idx`

---

## 6. Database Normalization Analysis

The database was designed and verified against Third Normal Form (3NF) principles:

### 1. First Normal Form (1NF)
- **Atomic Values**: Every table attribute contains single, indivisible values. Primary keys are explicitly defined on all tables.
- **Score Array Decision**: Rather than generating hundreds of thousands of low-cardinality rows in a child `student_scores` table for anonymous periodic examination tallies, student scores are stored in a native PostgreSQL JSON array attribute (`raw_scores`) accompanied by atomic computed statistics (`mean`, `sd`, `mps`, `highest_score`, `lowest_score`). This leverages PostgreSQL JSONB indexing while keeping writes and calculations atomic.

### 2. Second Normal Form (2NF)
- **Elimination of Partial Dependencies**: All tables utilize surrogate primary keys (`id`).
- In all non-junction tables, every non-key column is fully functionally dependent on the entire primary key, eliminating partial dependencies.
- Junction tables (`role_user`) use composite primary keys `(user_id, role_id)` with zero non-key attributes.

### 3. Third Normal Form (3NF)
- **Elimination of Transitive Dependencies**: Non-key attributes depend only on the primary key, not on other non-key attributes.
- **Audit Decision — Department Removal**: The redundant `department` column was removed from the `subjects` table. In DepEd Junior High School, learning areas ("Mathematics", "Science", etc.) are identical to their subjects. Storing department introduced a transitive dependency ($S \to \text{Department}$). Replacing this with standard curriculum codes (`code`, e.g., `MATH-7`) satisfied 3NF.
- `sections` references `school_year_id` and `grade_level_id` directly, without redundant intermediate columns.
- `teaching_assignments` links directly to primary foreign keys (`user_id`, `school_year_id`, `section_id`, `subject_id`).

---

## 7. Authentication, Authorization & RBAC

Authentication is handled via **Laravel Sanctum** token-based authorization.

### 7.1 Faculty Registration & Lifecycle Pipeline

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
                    |
                    | [Teacher Departs / Takes Leave]
                    v
           [Admin Deactivates]
                    |
                    v
   Status: 'approved', is_active: false
   (Tokens revoked, assignments ended, historical scores preserved)
```

### 7.2 Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | Public | Faculty (`role:teacher`) | System Administrator (`role:system_admin`) |
| :--- | :---: | :---: | :---: |
| `POST /api/auth/register` | Yes | Yes | Yes |
| `POST /api/auth/login` | Yes | Yes | Yes |
| `POST /api/auth/logout` | No | Yes | Yes |
| `GET /api/auth/me` | No | Yes | Yes |
| `GET /api/reference-data` | No | Yes | Yes |
| `GET /api/my-classes` | No | Own assigned classes | All assigned classes |
| `GET /api/assessments` | No | Own score sheets | All score sheets |
| `POST /api/assessments` | No | Assigned section/subject only | Any section/subject |
| `PUT /api/assessments/{id}` | No | Own score sheets only | Any score sheet |
| `DELETE /api/assessments/{id}` | No | Own score sheets only | Any score sheet |
| `GET /api/assessments/consolidation` | No | Forbidden (403) | School-Wide, Grade, & Section |
| `POST /api/school-years` | No | Forbidden (403) | Full Access |
| `PUT /api/school-years/{id}` | No | Forbidden (403) | Full Access |
| `DELETE /api/school-years/{id}` | No | Forbidden (403) | Full Access |
| `PATCH /api/terms/{id}/status` | No | Forbidden (403) | Full Access |
| `POST /api/sections` | No | Forbidden (403) | Full Access |
| `PUT /api/sections/{id}` | No | Forbidden (403) | Full Access |
| `DELETE /api/sections/{id}` | No | Forbidden (403) | Full Access |
| `GET /api/teachers` | No | Forbidden (403) | Full Access |
| `POST /api/teachers` | No | Forbidden (403) | Full Access |
| `PATCH /api/teachers/{id}/approve` | No | Forbidden (403) | Full Access |
| `PATCH /api/teachers/{id}/reject` | No | Forbidden (403) | Full Access |
| `PATCH /api/teachers/{id}/reactivate` | No | Forbidden (403) | Full Access |
| `DELETE /api/teachers/{id}` | No | Forbidden (403) | Full Access |
| `POST /api/teaching-assignments` | No | Forbidden (403) | Full Access |
| `POST /api/teaching-assignments/sync` | No | Forbidden (403) | Full Access |
| `DELETE /api/teaching-assignments/{id}` | No | Forbidden (403) | Full Access |

---

## 8. Comprehensive RESTful API Reference

All requests must provide an `Accept: application/json` header. Protected endpoints require `Authorization: Bearer <token>`.

### 8.1 System Health & Public Authentication

#### `GET /api/health`
- **Auth**: None
- **Description**: Lightweight health probe for Render / Docker orchestration.
- **Response `200 OK`**:
  ```json
  {
    "message": "API is active and running."
  }
  ```

#### `POST /api/auth/register`
- **Auth**: None
- **Description**: Self-register a prospective faculty account in `pending` state.
- **Request Body**:
  ```json
  {
    "name": "Maria Santos",
    "email": "maria.santos@gmail.com",
    "password": "Password123!",
    "password_confirmation": "Password123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Registration submitted successfully. Your account is pending administrator approval before you can sign in.",
    "requires_approval": true,
    "user": {
      "id": 12,
      "name": "Maria Santos",
      "email": "maria.santos@gmail.com",
      "approval_status": "pending"
    }
  }
  ```

#### `POST /api/auth/login`
- **Auth**: None
- **Description**: Authenticate credentials; verifies `is_active` and `approval_status`.
- **Request Body**:
  ```json
  {
    "email": "maria.santos@gmail.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Login successful.",
    "access_token": "1|raNDomToKEnStRinG...",
    "token_type": "Bearer",
    "user": {
      "id": 12,
      "name": "Maria Santos",
      "email": "maria.santos@gmail.com",
      "is_active": true,
      "approval_status": "approved",
      "roles": [
        { "id": 2, "name": "teacher" }
      ]
    }
  }
  ```
- **Errors**:
  - `403 Forbidden`: Account pending approval, rejected, or deactivated.
  - `422 Unprocessable Content`: Invalid email or password credentials.

#### `POST /api/auth/logout`
- **Auth**: `auth:sanctum`
- **Description**: Revokes active personal access token.
- **Response `200 OK`**: `{"message": "Logged out successfully."}`

#### `GET /api/auth/me`
- **Auth**: `auth:sanctum`
- **Description**: Returns authenticated user profile and roles.

---

### 8.2 Academic Reference Data

#### `GET /api/reference-data`
- **Auth**: `auth:sanctum`
- **Description**: Returns cached grade levels, active subjects, school years, and currently active school year for dropdown filters. Cached for 1 hour.
- **Response `200 OK`**:
  ```json
  {
    "grade_levels": [
      { "id": 1, "level": 7, "name": "Grade 7" }
    ],
    "subjects": [
      { "id": 1, "name": "Mathematics", "code": "MATH-7", "grade_level_id": 1, "is_active": true }
    ],
    "school_years": [
      {
        "id": 1,
        "name": "2025-2026",
        "is_active": true,
        "terms": [
          { "id": 1, "term_number": 1, "name": "1st Term", "status": "active" }
        ]
      }
    ],
    "active_sy": { "id": 1, "name": "2025-2026", "is_active": true }
  }
  ```

---

### 8.3 Assessment Records & Consolidation

#### `GET /api/my-classes`
- **Auth**: `auth:sanctum`
- **Description**: Returns classes and subjects assigned to the logged-in teacher for the active school year. Cached for 5 minutes.
- **Query Params**: `school_year_id` (optional)

#### `GET /api/assessments`
- **Auth**: `auth:sanctum`
- **Description**: Lists score sheet records. Teachers see only their own classes; administrators see all classes.
- **Query Params**: `school_year_id`, `term_id`, `section_id`, `subject_id`, `type`

#### `POST /api/assessments`
- **Auth**: `auth:sanctum`, `role:teacher,system_admin`
- **Description**: Encodes raw scores, automatically calculates Mean, SD, MPS, and Mastery, and stores the record in an atomic transaction.
- **Request Body**:
  ```json
  {
    "school_year_id": 1,
    "term_id": 1,
    "grade_level_id": 1,
    "section_id": 4,
    "subject_id": 3,
    "type": "term_exam",
    "total_items": 50,
    "raw_scores": [45, 42, 38, 48, 50, 31, 29, 44, 40, 37],
    "least_learned_competency": "Solving quadratic equations by factoring",
    "remarks": "Complete"
  }
  ```
- **Integrity Validations**:
  1. `term.isOpen()`: Checks that the term and school year are active and open.
  2. Grade Alignment: Verifies that `section.grade_level_id === subject.grade_level_id`.
  3. Workload Authorization: Verifies the teacher is assigned to this class.
  4. Overwrite Prevention: Verifies another teacher has not already recorded this assessment.
- **Response `201 Created`**:
  ```json
  {
    "message": "Assessment scores encoded and calculated successfully.",
    "data": {
      "id": 45,
      "school_year_id": 1,
      "term_id": 1,
      "grade_level_id": 1,
      "section_id": 4,
      "subject_id": 3,
      "teacher_id": 12,
      "type": "term_exam",
      "total_items": 50,
      "no_of_entries": 10,
      "mean": 40.40,
      "mps": 80.80,
      "sd": 6.34,
      "highest_score": 50.00,
      "lowest_score": 29.00,
      "mastery_level": "Moving Towards Mastery",
      "least_learned_competency": "Solving quadratic equations by factoring"
    }
  }
  ```

#### `GET /api/assessments/{id}`
- **Auth**: `auth:sanctum`
- **Description**: Returns detailed statistics and scores for a single assessment record. Teachers can only access their own records.

#### `PUT /api/assessments/{id}`
- **Auth**: `auth:sanctum`, `role:teacher,system_admin`
- **Description**: Updates scores and recalculates statistics. Rejected if the academic term is closed.

#### `DELETE /api/assessments/{id}`
- **Auth**: `auth:sanctum`, `role:teacher,system_admin`
- **Description**: Soft deletes the score sheet record. Non-admin teachers can only delete during an active open term.

#### `GET /api/assessments/consolidation`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Generates school-wide or grade-level consolidated analytics using pooled population variance.
- **Query Params**:
  - `school_year_id` (required)
  - `term_id` (required)
  - `type` (optional: `diagnostic`, `term_exam`)
  - `grade_level_id` (optional: restricts consolidation to a single grade level)
- **Response `200 OK`**:
  ```json
  {
    "summary": {
      "total_sections_encoded": 8,
      "total_examinees": 340,
      "overall_mean": 38.65,
      "overall_mps": 77.30,
      "overall_sd": 5.82,
      "overall_mastery": "Moving Towards Mastery"
    },
    "records": [
      {
        "id": 101,
        "section": { "name": "Rizal" },
        "subject": { "name": "Mathematics", "code": "MATH-7" },
        "no_of_entries": 42,
        "mean": 39.10,
        "mps": 78.20,
        "sd": 5.40,
        "mastery_level": "Moving Towards Mastery"
      }
    ]
  }
  ```

---

### 8.4 Academic Calendar Management

#### `GET /api/school-years`
- **Auth**: `auth:sanctum`
- **Description**: Returns list of all school years with their terms.

#### `POST /api/school-years`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Creates a new school year and auto-generates 3 DepEd terms (`1st Term`, `2nd Term`, `3rd Term`) in `pending` status.
- **Request Body**:
  ```json
  {
    "name": "2026-2027",
    "start_date": "2026-08-01",
    "end_date": "2027-05-31",
    "is_active": true
  }
  ```

#### `PUT /api/school-years/{id}`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Updates school year dates or active status.

#### `DELETE /api/school-years/{id}`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Soft deletes an inactive school year. Blocked if sections or assessment records exist.

#### `PATCH /api/terms/{id}/status`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Updates term status (`pending`, `active`, or `completed`). Setting a term to `active` automatically sets other active terms in the same year to `completed`.
- **Request Body**:
  ```json
  {
    "status": "active"
  }
  ```

---

### 8.5 Classroom Sections

#### `GET /api/sections`
- **Auth**: `auth:sanctum`
- **Query Params**: `school_year_id`, `grade_level_id`

#### `POST /api/sections`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Request Body**:
  ```json
  {
    "school_year_id": 1,
    "grade_level_id": 2,
    "name": "Emerald",
    "is_active": true
  }
  ```

#### `DELETE /api/sections/{id}`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Soft deletes a section. Blocked with HTTP 422 if assessment scores are recorded under it.

---

### 8.6 Faculty & Workload Management

#### `GET /api/teachers`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Query Params**: `include_inactive=true` (optional)
- **Description**: Lists faculty accounts with active teaching load counts.

#### `POST /api/teachers`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Directly provisions an approved, active faculty member.

#### `PATCH /api/teachers/{id}/approve`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Approves a pending self-registered faculty account.

#### `PATCH /api/teachers/{id}/reject`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Rejects a pending faculty registration.

#### `DELETE /api/teachers/{id}`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Deactivates a teacher: ends active assignments, deletes tokens, sets `is_active = false`. Historical score sheets remain preserved.

#### `PATCH /api/teachers/{id}/reactivate`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Restores an inactive faculty account.

#### `GET /api/teaching-assignments`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Query Params**: `school_year_id`, `user_id`

#### `POST /api/teaching-assignments`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Assigns a teacher to a section and subject. Checks for conflicts before assigning.

#### `POST /api/teaching-assignments/sync`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Batch synchronizes assigned classes for a teacher in an active school year. Closes removed assignments and inserts new assignments atomically.
- **Request Body**:
  ```json
  {
    "user_id": 12,
    "school_year_id": 1,
    "assignments": [
      { "section_id": 4, "subject_id": 3 },
      { "section_id": 5, "subject_id": 3 }
    ]
  }
  ```

#### `DELETE /api/teaching-assignments/{id}`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Description**: Ends a teaching assignment by populating `effective_until = now()`.

---

## 9. Automated Test Suite & Verification

The backend is backed by an automated test suite executed with PHPUnit:

```bash
php vendor/bin/phpunit
```

### Test Suite Structure (39 Tests, 157 Assertions)
- **`Tests\Feature\AuthAndRoleTest`** (6 tests, 26 assertions):
  - Sanctum authentication token issuance and revocation.
  - Multi-role authorization checks (`system_admin` vs `teacher`).
  - Pending approval gates blocking login for unapproved registrations.
- **`Tests\Feature\TeacherAssignmentTest`** (5 tests, 18 assertions):
  - Teaching workload allocation and conflict rejection.
  - PostgreSQL partial unique index verification for mid-year substitute teachers.
  - Batch workload synchronization (`syncTeacher`).
- **`Tests\Feature\SchoolYearAndTermTest`** (5 tests, 18 assertions):
  - Automated 3-term generation on school year creation.
  - Singularity of active school year enforcement.
  - Sequential term status transitions and period locking.
- **`Tests\Feature\TeacherAccountTest`** (9 tests, 50 assertions):
  - Self-registration pipeline and administrative approval workflow.
  - Direct account provisioning by administrators.
  - Account deactivation preserving historical assessment records.
  - Account reactivation restoring access.
- **`Tests\Feature\AssessmentAndSectionTest`** (6 tests, 25 assertions):
  - Descriptive statistics calculation accuracy (Mean, SD, MPS, Mastery).
  - Score bounds validation ($0 \le \text{score} \le \text{total\_items}$).
  - Academic alignment enforcement (section grade must match subject grade).
  - Referential deletion guard blocking section deletion when scores exist.
- **`Tests\Feature\AssessmentOwnershipTest`** (6 tests, 18 assertions):
  - Teacher record scoping (teachers can only view their own score sheets).
  - Cross-teacher overwrite prevention.
  - Administrative override privileges.
  - Pooled population variance calculation in consolidated reports.
- **`Tests\Unit\ExampleTest` & `Tests\Feature\ExampleTest`** (2 tests, 2 assertions):
  - Baseline framework health checks.

---

## 10. Oral Defense & Evaluation Q&A Guide

### Q1: "Walk us through the request lifecycle of your backend. How does an assessment submission flow through your system?"
> **Answer**: When a teacher enters student scores on the React frontend, an HTTP `POST` request is transmitted with a JSON payload and a Sanctum Bearer token to `/api/assessments`. The request enters Laravel's routing engine in `routes/api.php` and passes through our middleware pipeline:
> 1. `TrustProxies` and `HandleCors` validate the origin and headers.
> 2. `auth:sanctum` verifies the Bearer token and resolves the authenticated `User` model.
> 3. `EnsureUserHasRole` confirms the user holds either the `teacher` or `system_admin` role.
> 4. `StoreAssessmentRequest` intercepts the payload to validate types, item bounds, and foreign key existence.
> 5. `AssessmentController@store` executes four domain checks: (a) verifies the academic term is open and active, (b) verifies that `section.grade_level_id === subject.grade_level_id`, (c) verifies the teacher is assigned to teach that class, and (d) verifies that no other teacher has already recorded scores for that class.
> 6. The controller delegates score processing to `StatsCalculatorService`, which computes Mean, SD, MPS, and DepEd Mastery Level.
> 7. The record is persisted via Eloquent ORM within an atomic database transaction.
> 8. Finally, `AssessmentRecordResource` formats the response into a structured JSON payload and returns HTTP 201 Created.

---

### Q2: "How does your database handle mid-year substitute teachers without creating data conflicts or deleting past records?"
> **Answer**: In standard database designs, a unique constraint on `(school_year_id, section_id, subject_id)` prevents assigning a new teacher if the original teacher leaves or goes on leave. To solve this, we implemented a **PostgreSQL partial unique index**:
> ```sql
> CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique
> ON teaching_assignments (school_year_id, section_id, subject_id)
> WHERE effective_until IS NULL;
> ```
> When a teacher departs or is reassigned, their assignment is not deleted; instead, `effective_until` is set to the current date. The partial index only enforces uniqueness where `effective_until IS NULL`. This guarantees that only **one active teacher** teaches the class at any given time, while preserving historical assignment records for full administrative auditability.

---

### Q3: "Why did you use pooled population variance instead of simply averaging the standard deviations across sections?"
> **Answer**: Averaging standard deviations directly ($\frac{\sigma_1 + \sigma_2}{2}$) is a well-documented mathematical fallacy. Standard deviation is the square root of variance, making it non-linear. Averaging standard deviations ignores two critical factors: (1) differences in section sample sizes ($n_i$), and (2) the dispersion of individual section means ($\mu_i$) around the grand mean ($\bar{\mu}$).
>
> In `StatsCalculatorService`, we implement the true **pooled population variance**:
> $$\sigma^2_{\text{pooled}} = \frac{1}{N} \sum_{i=1}^{k} n_i \left( \sigma_i^2 + (\mu_i - \bar{\mu})^2 \right)$$
> This formula accounts for both **within-group variance** ($\sigma_i^2$) and **between-group variance** ($(\mu_i - \bar{\mu})^2$), guaranteeing mathematically accurate consolidation metrics for school administrators.

---

### Q4: "How does your system prevent accidental data corruption or loss of historical records?"
> **Answer**: We established three distinct architectural safeguards:
> 1. **Soft Deletes**: Implemented across `assessment_records`, `school_years`, `sections`, and `users`. Records can be deactivated or removed without physically deleting historical data from disk.
> 2. **Restrict-On-Delete Constraints**: Foreign keys linking `assessment_records` to teachers use `restrictOnDelete()`. A faculty account cannot be accidentally hard-deleted if official examination records are tied to them. Similarly, `SectionController@destroy` blocks section deletion if assessment records exist.
> 3. **Academic Period Locking**: In `AssessmentController`, score sheet creation, editing, and deletion are gated by `term.isOpen()` and `schoolYear.is_active`. Historical score sheets from closed terms or past school years cannot be modified by non-admin teachers.

---

### Q5: "Is your database normalized? How did you address potential normalization violations?"
> **Answer**: Yes, the schema conforms to Third Normal Form (3NF):
> - **1NF**: Every column contains atomic values, surrogate primary keys (`id`) are present on all tables, and repeating columns are eliminated.
> - **2NF**: All non-key attributes are fully functionally dependent on the entire primary key, eliminating partial dependencies.
> - **3NF**: Transitive dependencies were audited and removed. Specifically, we eliminated the redundant `department` column from the `subjects` table because in DepEd Junior High School, the learning area is identical to the subject name. In its place, we introduced standard curriculum codes (`code`, e.g., `MATH-7`), ensuring that every non-key attribute depends solely on the primary key.

---

### Q6: "Why store raw scores in a JSON array rather than a separate `student_scores` child table?"
> **Answer**: In periodic school-wide assessments at DNIHS, periodic score sheets are encoded as anonymous tallies of raw scores per examinee for statistical consolidation. Creating a dedicated table row for every student score would generate hundreds of thousands of low-cardinality rows with heavy index overhead and high join costs. By storing the score array in PostgreSQL's native JSON format alongside precalculated summary statistics, we achieve:
> 1. Atomic score sheet persistence within a single record update.
> 2. Zero join latency when retrieving individual score sheets.
> 3. Complete recalculation capability whenever scores are revised.
> 4. Sub-second consolidation queries backed by our composite index `assess_records_consolidation_idx`.

---

## 11. Institutional Deployment

This platform is developed for academic capstone presentation and institutional deployment at Dayap Integrated National High School (DNIHS), Division of Laguna, Department of Education (DepEd).
