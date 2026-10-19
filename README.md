# DNIHS Assessment Consolidation & Analytics API

A high-performance RESTful API and statistical computation engine built with **Laravel 11**, **PHP 8.3**, and **PostgreSQL**, engineered for student assessment score sheet encoding, automated descriptive statistics computation, and pooled variance consolidation.

---

## Table of Contents
1. [System Architecture & Request Lifecycle](#1-system-architecture--request-lifecycle)
2. [Statistical & Mathematical Calculation Engine](#2-statistical--mathematical-calculation-engine)
3. [Database Architecture & Schema Reference](#3-database-architecture--schema-reference)
4. [Database Normalization & Integrity Design](#4-database-normalization--integrity-design)
5. [Authentication, Authorization & RBAC](#5-authentication-authorization--rbac)
6. [Core Backend Controllers & Services](#6-core-backend-controllers--services)
7. [Comprehensive RESTful API Reference](#7-comprehensive-restful-api-reference)
8. [Automated Test Suite & Verification](#8-automated-test-suite--verification)
9. [Technical Architectural Implementations](#9-technical-architectural-implementations)

---

## 1. System Architecture & Request Lifecycle

The backend adopts the **Model-View-Controller (MVC)** architectural pattern as an autonomous RESTful API server deployed in a decoupled environment alongside a React 19 Single Page Application.

### 1.1 Architecture Flowchart

```
+---------------------------------------------------------------------------------------------------+
|                                      HTTP CLIENT (BROWSER)                                        |
|                       React 19 SPA (RecordEntry, PerformanceReport, Calendar)                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                         HTTPS / JSON Payload
                                         (Bearer Authorization)
                                                  v
+---------------------------------------------------------------------------------------------------+
| 1. ROUTING LAYER (routes/api.php & routes/web.php)                                                |
|    - Maps URI patterns to explicit Controller action tuples: [Controller::class, 'method']       |
|    - Root route (/) returns active JSON API status                                                |
|    - Web fallback delegates unmatched routes to uniform JSON 404 handler                          |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 2. HTTP MIDDLEWARE PIPELINE                                                                       |
|    - Cors: Handles pre-flight OPTIONS requests and validates allowed frontend origins              |
|    - TrustProxies: Configures reverse proxy headers and terminates TLS                            |
|    - auth:sanctum: Validates Bearer token and resolves authenticatable User entity                |
|    - EnsureUserHasRole: Restricts endpoint access using RBAC parameters ('role:system_admin', etc)|
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 3. FORM REQUEST VALIDATION LAYER (app/Http/Requests)                                              |
|    - StoreAssessmentRequest, UpdateAssessmentRequest                                              |
|    - StoreSectionRequest, UpdateSectionRequest                                                    |
|    - StoreSchoolYearRequest, UpdateSchoolYearRequest, UpdateTermStatusRequest                     |
|    - StoreTeachingAssignmentRequest, SyncTeachingAssignmentRequest                               |
|    - StoreTeacherRequest, LoginRequest, RegisterRequest                                           |
|    - Sanitizes input types, validates foreign key existence, and enforces bounds                  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 4. CONTROLLER LAYER (app/Http/Controllers/Api)                                                    |
|    - Coordinates business workflows, enforces calendar period locks and ownership isolation      |
|    - Delegates statistical computations to domain service                                         |
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
|    - Encapsulates schema relations, eager loading scopes (with, withCount), and SoftDeletes       |
|    - Prepared SQL execution against PostgreSQL                                                    |
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

## 2. Statistical & Mathematical Calculation Engine

All descriptive statistics and consolidation calculations are encapsulated within `App\Services\StatsCalculatorService`.

### 2.1 Section-Level Descriptive Statistics

Given a set of valid numeric scores $X = \{x_1, x_2, \dots, x_n\}$ where $n \ge 1$ and test items $T > 0$:

#### 1. Arithmetic Mean ($\bar{x}$)
$$\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i$$

#### 2. Mean Percentage Score ($\text{MPS}$)
Represents the percentage of test items answered correctly on average:
$$\text{MPS} = \left( \frac{\bar{x}}{T} \right) \times 100$$

#### 3. Population Variance ($\sigma^2$) & Standard Deviation ($\sigma$)
The system computes the population standard deviation ($N$ divisor) because the score sheet represents the entire examinee cohort present:
$$\sigma^2 = \frac{1}{n} \sum_{i=1}^{n} (x_i - \bar{x})^2, \quad \sigma = \sqrt{\sigma^2}$$

#### 4. Extremes
$$\text{High} = \max(x_1, x_2, \dots, x_n), \quad \text{Low} = \min(x_1, x_2, \dots, x_n)$$

```php
// app/Services/StatsCalculatorService.php (extract)
public function calculate(array $scores, int|float $totalItems = 50): array
{
    $validScores = array_values(array_filter($scores, fn ($s) => is_numeric($s)));
    $n = count($validScores);

    if ($n === 0) {
        return [
            'no_of_entries' => 0,
            'mean' => 0.0,
            'mps' => 0.0,
            'sd' => 0.0,
            'highest_score' => 0.0,
            'lowest_score' => 0.0,
            'total_items' => (int) $totalItems,
            'mastery_level' => 'Pending',
        ];
    }

    $totalItems = (float) $totalItems > 0 ? (float) $totalItems : 50.0;
    $mean = array_sum($validScores) / $n;
    $mps = ($mean / $totalItems) * 100.0;

    $variance = array_reduce(
        $validScores,
        fn ($carry, $x) => $carry + ($x - $mean) ** 2,
        0.0
    ) / $n;

    $sd = sqrt($variance);

    return [
        'no_of_entries' => $n,
        'mean' => round($mean, 2),
        'mps' => round($mps, 2),
        'sd' => round($sd, 2),
        'highest_score' => round(max($validScores), 2),
        'lowest_score' => round(min($validScores), 2),
        'total_items' => (int) $totalItems,
        'mastery_level' => $this->classifyMasteryLevel($mps),
    ];
}
```

---

### 2.2 DepEd 7-Bracket Mastery Classification Scale

```php
public function classifyMasteryLevel(float $mps): string
{
    return match (true) {
        $mps >= 96.0 => 'Mastered',
        $mps >= 86.0 => 'Closely Approximating Mastery',
        $mps >= 66.0 => 'Moving Towards Mastery',
        $mps >= 35.0 => 'Average',
        $mps >= 15.0 => 'Low',
        $mps >= 5.0 => 'Very Low',
        default => 'Absolutely No Mastery',
    };
}
```

| MPS Range | DepEd Verbal Interpretation |
| :---: | :--- |
| **$96.00\% - 100.00\%$** | **Mastered** |
| **$86.00\% - 95.99\%$** | **Closely Approximating Mastery** |
| **$66.00\% - 85.99\%$** | **Moving Towards Mastery** |
| **$35.00\% - 65.99\%$** | **Average** |
| **$15.00\% - 34.99\%$** | **Low** |
| **$5.00\% - 14.99\%$** | **Very Low** |
| **$0.00\% - 4.99\%$** | **Absolutely No Mastery** |

---

### 2.3 Multi-Section Pooled Consolidation Algorithm

A common mathematical fallacy in educational reporting is calculating aggregate standard deviation by averaging section standard deviations:
$$\sigma_{\text{invalid}} = \frac{\sigma_1 + \sigma_2 + \dots + \sigma_k}{k} \quad \text{(Statistically False)}$$

Because standard deviation is non-linear, naive averaging ignores varying sample sizes ($n_i$) and between-group mean differences. The system calculates true **pooled population variance**:

1. **Total Examinees**: $N = \sum_{i=1}^{k} n_i$
2. **Overall Weighted Mean**: $\bar{\mu} = \frac{1}{N} \sum_{i=1}^{k} n_i \bar{x}_i$
3. **Overall Weighted MPS**: $\text{MPS}_{\text{overall}} = \frac{1}{N} \sum_{i=1}^{k} n_i \text{MPS}_i$
4. **Pooled Population Variance**:
   $$\sigma^2_{\text{pooled}} = \frac{1}{N} \sum_{i=1}^{k} n_i \left( \sigma_i^2 + (\bar{x}_i - \bar{\mu})^2 \right)$$
5. **Consolidated Standard Deviation**: $\sigma_{\text{overall}} = \sqrt{\sigma^2_{\text{pooled}}}$

```php
// app/Services/StatsCalculatorService.php (extract)
$sumWeightedMean = 0.0;
$sumWeightedMps  = 0.0;
foreach ($records as $r) {
    $n = (int) ($r->no_of_entries ?? 0);
    $weight = $n > 0 ? $n : 1;
    $sumWeightedMean += (float) ($r->mean ?? 0.0) * $weight;
    $sumWeightedMps  += (float) ($r->mps  ?? 0.0) * $weight;
}

$overallMean = $totalExaminees > 0 ? ($sumWeightedMean / $totalExaminees) : 0.0;
$overallMps  = $totalExaminees > 0 ? ($sumWeightedMps  / $totalExaminees) : 0.0;

$sumVarianceComponents = 0.0;
foreach ($records as $r) {
    $n = (int) ($r->no_of_entries ?? 0);
    $meanVal = (float) ($r->mean ?? 0.0);
    $sdVal   = (float) ($r->sd   ?? 0.0);
    $weight  = $n > 0 ? $n : 1;

    $varianceI = $sdVal ** 2;
    $betweenGroupI = ($meanVal - $overallMean) ** 2;

    $sumVarianceComponents += $weight * ($varianceI + $betweenGroupI);
}

$pooledVariance = $totalExaminees > 0 ? ($sumVarianceComponents / $totalExaminees) : 0.0;
$overallSd = sqrt($pooledVariance);
```

---

## 3. Database Architecture & Schema Reference

### 3.1 Entity Relationship Model (ERD)

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

### 3.2 Database Table Definitions

#### 1. `users`
| Column | Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `bigint` | No | Auto | Primary Key |
| `name` | `varchar(255)` | No | — | Full name |
| `email` | `varchar(255)` | No | — | Unique login email (`users_email_unique`) |
| `email_verified_at` | `timestamp` | Yes | `null` | Verification date |
| `password` | `varchar(255)` | No | — | Bcrypt hashed password |
| `is_active` | `boolean` | No | `true` | Login authorization state |
| `approval_status` | `varchar(50)` | No | `'approved'` | `'pending'`, `'approved'`, `'rejected'` (`users_approval_status_idx`) |
| `approved_at` | `timestamp` | Yes | `null` | Approval timestamp |
| `created_at` / `updated_at` | `timestamp` | Yes | `null` | Timestamps |
| `deleted_at` | `timestamp` | Yes | `null` | SoftDeletes |

#### 2. `roles` & `role_user`
- `roles`: `id` (PK), `name` (unique, e.g. `'system_admin'`, `'teacher'`), `description`.
- `role_user`: `user_id` (FK $\to$ `users.id` cascade), `role_id` (FK $\to$ `roles.id` cascade). Composite PK: `(user_id, role_id)`.

#### 3. `school_years`
| Column | Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `bigint` | No | Auto | Primary Key |
| `name` | `varchar(255)` | No | — | Unique academic year label (e.g. `'2025-2026'`) |
| `start_date` | `date` | No | — | Calendar start date |
| `end_date` | `date` | No | — | Calendar end date |
| `is_active` | `boolean` | No | `false` | Active academic year flag (`school_years_is_active_idx`) |
| `deleted_at` | `timestamp` | Yes | `null` | SoftDeletes |

#### 4. `terms`
| Column | Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `bigint` | No | Auto | Primary Key |
| `school_year_id` | `bigint` | No | — | FK $\to$ `school_years.id` cascade |
| `term_number` | `smallint` | No | — | Term ordinal: 1, 2, or 3 |
| `name` | `varchar(255)` | No | — | e.g. `'1st Term'` |
| `status` | `varchar(50)` | No | `'pending'` | `'pending'`, `'active'`, `'completed'` |
| `start_date` | `date` | Yes | `null` | Optional start date |
| `end_date` | `date` | Yes | `null` | Optional end date |

- Composite Unique Constraint on `(school_year_id, term_number)`

#### 5. `grade_levels`
| Column | Type | Nullable | Constraints / Description |
| :--- | :--- | :---: | :--- |
| `id` | `bigint` | No | Primary Key |
| `level` | `smallint` | No | Unique numeric grade: `7`, `8`, `9`, `10` |
| `name` | `varchar(255)` | No | Display name: `'Grade 7'` |

#### 6. `subjects`
| Column | Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `bigint` | No | Auto | Primary Key |
| `grade_level_id` | `bigint` | No | — | FK $\to$ `grade_levels.id` cascade |
| `name` | `varchar(255)` | No | — | Subject title (e.g. `'Mathematics'`) |
| `code` | `varchar(50)` | Yes | `null` | Standardized curriculum code (e.g. `'MATH-7'`) |
| `is_active` | `boolean` | No | `true` | Active status flag |

#### 7. `sections`
| Column | Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `bigint` | No | Auto | Primary Key |
| `school_year_id` | `bigint` | No | — | FK $\to$ `school_years.id` cascade |
| `grade_level_id` | `bigint` | No | — | FK $\to$ `grade_levels.id` cascade (`sections_grade_level_id_idx`) |
| `name` | `varchar(255)` | No | — | Section name (e.g. `'Rizal'`) |
| `is_active` | `boolean` | No | `true` | Active status flag |
| `deleted_at` | `timestamp` | Yes | `null` | SoftDeletes |

- Composite Unique Constraint on `(school_year_id, grade_level_id, name)`

#### 8. `teaching_assignments`
| Column | Type | Nullable | Constraints / Description |
| :--- | :--- | :---: | :--- |
| `id` | `bigint` | No | Primary Key |
| `user_id` | `bigint` | No | FK $\to$ `users.id` cascade |
| `school_year_id` | `bigint` | No | FK $\to$ `school_years.id` cascade |
| `section_id` | `bigint` | No | FK $\to$ `sections.id` cascade |
| `subject_id` | `bigint` | No | FK $\to$ `subjects.id` cascade |
| `effective_from` | `date` | No | Assignment effective start date |
| `effective_until` | `date` | Yes | Concluded date (`null` = currently active) |
| `assigned_by` | `bigint` | Yes | FK $\to$ `users.id` set null |

- **Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique
  ON teaching_assignments (school_year_id, section_id, subject_id)
  WHERE effective_until IS NULL;
  ```

#### 9. `assessment_records`
| Column | Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `bigint` | No | Auto | Primary Key |
| `school_year_id` | `bigint` | No | — | FK $\to$ `school_years.id` cascade |
| `term_id` | `bigint` | No | — | FK $\to$ `terms.id` cascade |
| `grade_level_id` | `bigint` | No | — | FK $\to$ `grade_levels.id` cascade |
| `section_id` | `bigint` | No | — | FK $\to$ `sections.id` **restrict** |
| `subject_id` | `bigint` | No | — | FK $\to$ `subjects.id` cascade |
| `teacher_id` | `bigint` | No | — | FK $\to$ `users.id` **restrict** |
| `type` | `varchar(50)` | No | `'term_exam'` | `'diagnostic'`, `'term_exam'` |
| `total_items` | `integer` | No | `50` | Total test items |
| `raw_scores` | `json` / `jsonb` | No | — | Student score array `[45, 42, 38, ...]` |
| `no_of_entries` | `integer` | No | — | Valid examinees ($N$) |
| `mean` | `decimal(5,2)` | No | — | Arithmetic Mean |
| `mps` | `decimal(5,2)` | No | — | Mean Percentage Score |
| `sd` | `decimal(5,2)` | No | — | Population Standard Deviation |
| `highest_score` | `decimal(5,2)` | No | — | Maximum score |
| `lowest_score` | `decimal(5,2)` | No | — | Minimum score |
| `least_learned_competency` | `text` | Yes | `null` | Weak competency identifier |
| `remarks` | `varchar(255)` | Yes | `'Complete'` | Status remark |
| `deleted_at` | `timestamp` | Yes | `null` | SoftDeletes |

- Composite Unique Constraint on `(school_year_id, term_id, section_id, subject_id, type)`
- Composite Reporting Index on `(school_year_id, term_id, type, grade_level_id)` named `assess_records_consolidation_idx`

---

## 4. Database Normalization & Integrity Design

### 4.1 Normalization Audit
- **First Normal Form (1NF)**: All attributes contain atomic values. Each table defines an explicit surrogate primary key (`id`).
- **Second Normal Form (2NF)**: All non-key attributes depend entirely on the primary key, eliminating partial dependencies. Junction table `role_user` uses composite key `(user_id, role_id)` with zero non-key attributes.
- **Third Normal Form (3NF)**: Transitive dependencies removed. The redundant `department` column was removed from `subjects` ($S \to \text{Department}$). Replaced with standard curriculum codes (`code`, e.g. `MATH-7`).

### 4.2 Raw Scores Storage Decision: JSON Array vs. Rows
Rather than creating individual table rows in a child `student_scores` table for periodic examination tallies, student scores are stored in a native PostgreSQL JSON array attribute (`raw_scores`) alongside computed statistics:
1. **Atomic Persistence**: Score entry, mean calculation, and extremes update within a single atomic row transaction.
2. **Zero Join Latency**: Reading a score sheet requires 0 table joins against a millions-row score table.
3. **Audit Reproducibility**: The raw array preserves individual score data, allowing complete recalculation if total test items change.

### 4.3 Referential Integrity & Deletion Guards
- `restrictOnDelete()` on `assessment_records.teacher_id`: A faculty member account cannot be hard-deleted if they own official examination records.
- `restrictOnDelete()` on `assessment_records.section_id`: Sections with encoded assessments cannot be deleted.
- SoftDeletes applied to `assessment_records`, `school_years`, `sections`, and `users` to protect historical reporting.

---

## 5. Authentication, Authorization & RBAC

Authentication is handled via **Laravel Sanctum** token-based authorization.

### 5.1 Registration & Account Lifecycle

```
POST /api/auth/register
         |
         v
approval_status: 'pending', is_active: false
         |
         +--------------------------------+
         |                                |
PATCH /teachers/{id}/approve      PATCH /teachers/{id}/reject
         |                                |
         v                                v
approval_status: 'approved'       approval_status: 'rejected'
is_active: true                   is_active: false
(Login permitted)                 (Login blocked HTTP 403)
         |
         | DELETE /teachers/{id}
         v
approval_status: 'approved', is_active: false
(Tokens deleted, assignments ended, historical scores preserved)
```

### 5.2 RBAC Permission Matrix

| Endpoint | Method | Public | Teacher (`role:teacher`) | System Admin (`role:system_admin`) |
| :--- | :---: | :---: | :---: | :---: |
| `/api/auth/register` | `POST` | Yes | Yes | Yes |
| `/api/auth/login` | `POST` | Yes | Yes | Yes |
| `/api/auth/logout` | `POST` | No | Yes | Yes |
| `/api/auth/me` | `GET` | No | Yes | Yes |
| `/api/reference-data` | `GET` | No | Yes | Yes |
| `/api/my-classes` | `GET` | No | Own classes (cached) | All classes |
| `/api/assessments` | `GET` | No | Own classes only | All classes |
| `/api/assessments` | `POST` | No | Assigned class only | Any class |
| `/api/assessments/{id}` | `PUT` | No | Own record only | Any record |
| `/api/assessments/{id}` | `DELETE` | No | Own record only | Any record |
| `/api/assessments/consolidation` | `GET` | No | 403 Forbidden | Full Access |
| `/api/school-years` | `POST`/`PUT`/`DELETE` | No | 403 Forbidden | Full Access |
| `/api/terms/{id}/status` | `PATCH` | No | 403 Forbidden | Full Access |
| `/api/sections` | `POST`/`PUT`/`DELETE` | No | 403 Forbidden | Full Access |
| `/api/teachers` | `GET`/`POST`/`DELETE` | No | 403 Forbidden | Full Access |
| `/api/teachers/{id}/approve` | `PATCH` | No | 403 Forbidden | Full Access |
| `/api/teachers/{id}/reject` | `PATCH` | No | 403 Forbidden | Full Access |
| `/api/teachers/{id}/reactivate` | `PATCH` | No | 403 Forbidden | Full Access |
| `/api/teaching-assignments` | `GET`/`POST`/`DELETE`| No | 403 Forbidden | Full Access |
| `/api/teaching-assignments/sync` | `POST` | No | 403 Forbidden | Full Access |

---

## 6. Core Backend Controllers & Services

### 6.1 `AssessmentController`
- `myClasses(Request $request)`: Returns classes assigned to current teacher. Cached for 300 seconds via `Cache::store('file')`.
- `index(Request $request)`: Queries `AssessmentRecord` with filters (`school_year_id`, `term_id`, `section_id`, `subject_id`, `type`). Enforces teacher isolation scope.
- `store(StoreAssessmentRequest $request)`:
  - Enforces `term.isOpen()` and `schoolYear.is_active`.
  - Enforces grade alignment: `section.grade_level_id === subject.grade_level_id`.
  - Enforces assignment verification: non-admins must be actively assigned via `TeachingAssignment`.
  - Enforces overwrite guard: stops teacher from overwriting an existing score sheet by another teacher.
  - Computes statistics via `StatsCalculatorService` and executes `updateOrCreate` in a database transaction.
- `update(UpdateAssessmentRequest $request, AssessmentRecord $assessment)`: Ownership check, period lock check, recalculates statistics, and saves.
- `destroy(Request $request, AssessmentRecord $assessment)`: Soft deletes record. Non-admins gated by ownership and active period.
- `consolidation(Request $request)`: Admin-only. Computes consolidated statistics using `StatsCalculatorService::summarizeConsolidation()`.

### 6.2 `TeacherAssignmentController`
- `store(StoreTeachingAssignmentRequest $request)`: Verifies no active teacher is currently occupying the class before creating assignment.
- `destroy(TeachingAssignment $teaching_assignment)`: Concludes assignment by populating `effective_until = now()`.
- `syncTeacher(SyncTeachingAssignmentRequest $request)`: Atomic transaction:
  1. Identifies dropped classes $\to$ updates `effective_until = now()`.
  2. Unassigns any previous teachers occupying newly selected classes.
  3. Bulk inserts new assignment rows.
  4. Clears teacher schedule cache.

### 6.3 `TeacherController`
- `index(Request $request)`: Queries users with `role:teacher`. Includes `active_loads_count` using `withCount`.
- `store(StoreTeacherRequest $request)`: Directly provisions pre-approved, active faculty account.
- `approve(User $teacher)`: Sets `approval_status = 'approved'`, `is_active = true`, `approved_at = now()`.
- `reject(User $teacher)`: Sets `approval_status = 'rejected'`, `is_active = false`.
- `destroy(User $teacher)`: Deactivates teacher in atomic transaction: sets `effective_until` on active teaching assignments, revokes all tokens via `$teacher->tokens()->delete()`, and sets `is_active = false`. Historical assessment records are preserved.
- `reactivate(User $teacher)`: Restores `is_active = true`.

### 6.4 `SchoolYearController` & `TermController`
- `SchoolYearController@store`: Creates school year, ensures active year singularity, and auto-provisions 3 terms (`1st Term`, `2nd Term`, `3rd Term`) in `pending` status.
- `SchoolYearController@destroy`: Rejects deletion if sections or assessments are linked. Rejects deletion if active.
- `TermController@updateStatus`: Updates term status. Setting to `active` automatically sets any other active terms in that year to `completed`.

---

## 7. Comprehensive RESTful API Reference

Headers:
- `Accept: application/json`
- `Authorization: Bearer <token>` (on protected routes)

### 7.1 Authentication & Profile

#### `POST /api/auth/register`
- **Auth**: None
- **Body**:
  ```json
  {
    "name": "Juan Dela Cruz",
    "email": "juan.delacruz@gmail.com",
    "password": "Password123!",
    "password_confirmation": "Password123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Registration submitted successfully. Your account is pending administrator approval before you can sign in.",
    "requires_approval": true,
    "user": { "id": 15, "name": "Juan Dela Cruz", "email": "juan.delacruz@gmail.com", "approval_status": "pending" }
  }
  ```

#### `POST /api/auth/login`
- **Auth**: None
- **Body**: `{"email": "juan.delacruz@gmail.com", "password": "Password123!"}`
- **Response `200 OK`**:
  ```json
  {
    "message": "Login successful.",
    "access_token": "2|raNDomToKEn...",
    "token_type": "Bearer",
    "user": { "id": 15, "name": "Juan Dela Cruz", "email": "juan.delacruz@gmail.com", "roles": [{ "id": 2, "name": "teacher" }] }
  }
  ```

#### `POST /api/auth/logout`
- **Auth**: `auth:sanctum`
- **Response `200 OK`**: `{"message": "Logged out successfully."}`

#### `GET /api/auth/me`
- **Auth**: `auth:sanctum`
- **Response `200 OK`**: `{"user": { ... }}`

---

### 7.2 Academic Reference

#### `GET /api/reference-data`
- **Auth**: `auth:sanctum`
- **Description**: Returns grade levels, active subjects, school years with terms, and active year. Cached for 1 hour.
- **Response `200 OK`**:
  ```json
  {
    "grade_levels": [{ "id": 1, "level": 7, "name": "Grade 7" }],
    "subjects": [{ "id": 1, "name": "Mathematics", "code": "MATH-7", "grade_level_id": 1, "is_active": true }],
    "school_years": [{ "id": 1, "name": "2025-2026", "is_active": true, "terms": [...] }],
    "active_sy": { "id": 1, "name": "2025-2026", "is_active": true }
  }
  ```

---

### 7.3 Assessments & Consolidation

#### `GET /api/my-classes`
- **Auth**: `auth:sanctum`
- **Query**: `school_year_id` (optional)
- **Response `200 OK`**: `{"data": [...]}`

#### `GET /api/assessments`
- **Auth**: `auth:sanctum`
- **Query**: `school_year_id`, `term_id`, `section_id`, `subject_id`, `type`
- **Response `200 OK`**: `{"data": [...]}`

#### `POST /api/assessments`
- **Auth**: `auth:sanctum`, `role:teacher,system_admin`
- **Body**:
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
    "least_learned_competency": "Factoring polynomials",
    "remarks": "Complete"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Assessment scores encoded and calculated successfully.",
    "data": {
      "id": 88,
      "no_of_entries": 10,
      "mean": 40.40,
      "mps": 80.80,
      "sd": 6.34,
      "highest_score": 50.00,
      "lowest_score": 29.00,
      "mastery_level": "Moving Towards Mastery"
    }
  }
  ```

#### `GET /api/assessments/consolidation`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Query**: `school_year_id` (required), `term_id` (required), `type` (optional), `grade_level_id` (optional)
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
    "records": [...]
  }
  ```

---

### 7.4 Faculty & Teaching Workloads

#### `GET /api/teachers`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Query**: `include_inactive=true` (optional)
- **Response `200 OK`**: `{"data": [...]}`

#### `POST /api/teachers`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Body**: `{"name": "Faculty Name", "email": "faculty@gmail.com", "password": "Password123!"}`
- **Response `201 Created`**: `{"message": "Faculty member account provisioned successfully.", "data": { ... }}`

#### `PATCH /api/teachers/{id}/approve`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Response `200 OK`**: `{"message": "Registration approved and activated."}`

#### `PATCH /api/teachers/{id}/reject`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Response `200 OK`**: `{"message": "Registration was rejected."}`

#### `DELETE /api/teachers/{id}`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Response `200 OK`**: `{"message": "Teacher account removed. Historical assessment records were preserved."}`

#### `POST /api/teaching-assignments/sync`
- **Auth**: `auth:sanctum`, `role:system_admin`
- **Body**:
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
- **Response `200 OK`**: `{"message": "Teaching assignments updated successfully."}`

---

## 8. Automated Test Suite & Verification

The test suite runs via PHPUnit with SQLite in-memory or PostgreSQL test connections:

```bash
php vendor/bin/phpunit
```

### Test Coverage Breakdown (39 Tests, 157 Assertions)
- **`Tests\Feature\AuthAndRoleTest`** (6 tests, 26 assertions):
  - Token generation, revocation, and role attachment (`system_admin` vs `teacher`).
  - Pending approval gates blocking login for unapproved accounts.
- **`Tests\Feature\TeacherAssignmentTest`** (5 tests, 18 assertions):
  - Teaching load allocation and conflict rejection.
  - Partial unique index verification for mid-year substitute teachers.
  - Batch workload synchronization (`syncTeacher`).
- **`Tests\Feature\SchoolYearAndTermTest`** (5 tests, 18 assertions):
  - Automatic 3-term generation upon school year creation.
  - Active school year singularity.
  - Sequential term status transition and period locking.
- **`Tests\Feature\TeacherAccountTest`** (9 tests, 50 assertions):
  - Self-registration approval pipeline (`pending` $\to$ `approved` / `rejected`).
  - Administrator direct account provisioning.
  - Deactivation with historical record retention.
  - Reactivation workflows.
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

## 9. Technical Architectural Implementations

### 1. Mid-Year Faculty Substitute Handling
```sql
CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique
ON teaching_assignments (school_year_id, section_id, subject_id)
WHERE effective_until IS NULL;
```
Standard unique constraints block assigning a new teacher if an existing assignment exists. By adding `WHERE effective_until IS NULL`, the database guarantees only one teacher is currently active per class, while allowing historical assignments (`effective_until` populated) to persist without conflict.

### 2. Multi-Year Historical Retention
- **SoftDeletes**: Applied across `assessment_records`, `school_years`, `sections`, and `users`.
- **Restrict Constraints**:
  ```php
  $table->foreign('teacher_id')->references('id')->on('users')->restrictOnDelete();
  $table->foreign('section_id')->references('id')->on('sections')->restrictOnDelete();
  ```
  Prevents accidental cascading hard-deletes of faculty or sections tied to historical score sheets.
- **Academic Period Locking**: In `AssessmentController`, operations are gated by `$term->isOpen()` and `$schoolYear->is_active`. Historical score sheets from closed terms cannot be modified by non-admin accounts.

### 3. High-Speed Reporting Index
```sql
CREATE INDEX assess_records_consolidation_idx
ON assessment_records (school_year_id, term_id, type, grade_level_id);
```
Enables instant evaluation of multi-section pooled variance queries across hundreds of classes without table scans.
