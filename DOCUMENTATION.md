# POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
## Calauan Campus
### COMP 016 and COMP 018 Midterm Project

---

## DNIHS - Assessment Consolidation & Analytics Decision Support System (DSS)

**Members:**
1. ____________________________________ sig. _________
2. ____________________________________ sig. _________
3. ____________________________________ sig. _________
4. ____________________________________ sig. _________

---

## Project Overview

The **DNIHS Assessment Consolidation & Analytics Decision Support System (DSS)** is an enterprise-grade academic assessment management platform designed specifically for **Dayap Integrated National High School (DNIHS)** under the Department of Education (DepEd).

### What does it do?
The system automates the encoding, statistical analysis, and institutional consolidation of periodic student examinations (Diagnostic Tests and Periodic Term Examinations) across Junior High School (Grades 7 through 10). It automatically calculates key descriptive statistics:
- Total valid examinees ($N$)
- Arithmetic Mean ($\bar{x}$)
- Mean Percentage Score ($\text{MPS}$)
- Population Standard Deviation ($\sigma$)
- Score extremes (Highest and Lowest scores)
- DepEd 7-Bracket Verbal Mastery Descriptors (from "Mastered" down to "Absolutely No Mastery")
- Least learned competencies identification

### What problem does it solve?
In high school public education, consolidation has historically relied on fragmented manual spreadsheets and paper records. This workflow causes:
1. Significant manual tabulation errors in calculating statistical indicators.
2. Statistically flawed school-wide reporting (such as naively averaging standard deviations across sections of unequal sizes).
3. Slow and delayed turnaround in identifying low-performing subjects and learning competencies.
4. Loss of historical records when teachers transfer or go on leave mid-year.

### Who benefits?
- **Classroom Teachers**: Gain a spreadsheet-like score encoding interface that automatically computes examination statistics and identifies least learned competencies with zero manual math.
- **Department Heads & Academic Coordinators**: Instantly evaluate subject-wide mastery levels across sections and grade levels without waiting weeks for consolidated manual submissions.
- **School Administrators & Principals**: Access an automated Decision Support System (DSS) offering school-wide consolidated analytics using mathematically rigorous pooled population variance to make data-driven decisions on remedial instruction and resource allocation.
- **DepEd Division Supervisors**: Receive standardized, accurate, and audit-compliant academic reports adhering strictly to DepEd grading parameters and academic calendar standards.

---

## Screens

### Frontend Technical Summary
The client application is built as a responsive Single Page Application (SPA) leveraging:
- **Framework & Core**: React 19 with Vite asset bundling.
- **Styling & Tokens**: Tailwind CSS v4 following Apple Human Interface Guidelines (clean neutral backgrounds, elevated frosted cards, clear visual hierarchy, and accessible typography).
- **Icons & Motion**: Lucide React iconography and Motion for smooth tab transitions without remounting memory state.
- **Responsive Views**: Desktop-first layout with collapsible navigation sidebars and full mobile drawer navigation for tablet and mobile devices.

---

### Screen 1: Login & Authentication Screen

```
+---------------------------------------------------------------------------------------------------------+
| [PLACE SCREENSHOT HERE]                                                                                 |
| Screenshot Instructions:                                                                                |
| 1. Open the system in your browser: https://dnihs-assessment-consolidation-anal.vercel.app/             |
| 2. Ensure you are logged out so the login screen appears.                                                |
| 3. The card should clearly show the DepEd / DNIHS circular badge, "Sign in to DNIHS",                    |
|    Email Address input, Password input with eye toggle icon, and blue "Sign In" button.                 |
+---------------------------------------------------------------------------------------------------------+
```

**Short Description**:
The entry point for all users. Faculty members and administrators authenticate using their email and password. The system checks account status and displays clear validation states if an account is pending administrative approval, deactivated, or rejected. A toggle allows prospective faculty members to switch to the self-registration form.

---

### Screen 2: Faculty Assessment Record Entry & Dynamic Score Sheet

```
+---------------------------------------------------------------------------------------------------------+
| [PLACE SCREENSHOT HERE]                                                                                 |
| Screenshot Instructions:                                                                                |
| 1. Log in with a teacher account (or admin account with a class assigned).                              |
| 2. Navigate to the "Record Entry" tab in the sidebar.                                                   |
| 3. Select a School Year, Term (e.g., 1st Term), Grade Level, Section, and Subject.                       |
| 4. Enter a few sample raw scores (e.g., 45, 42, 38, 48, 50, 35) in the score sheet table.                |
| 5. Capture the screen showing the dynamic score table, item count, and the real-time summary statistics  |
|    (Total Examinees, Mean, MPS, SD, and DepEd Mastery Level badge) displayed above or beside the sheet. |
+---------------------------------------------------------------------------------------------------------+
```

**Short Description**:
Allows teachers to encode student raw scores in an interactive spreadsheet-style table. As scores are entered, the system calculates the Mean, Standard Deviation, and Mean Percentage Score (MPS) in real-time. Teachers can also enter the least learned competency and notes before submitting. Built-in guards prevent overwriting another teacher's score sheet and lock editing if the academic term is closed.

---

### Screen 3: Administrative Decision Support & Consolidated Performance Report

```
+---------------------------------------------------------------------------------------------------------+
| [PLACE SCREENSHOT HERE]                                                                                 |
| Screenshot Instructions:                                                                                |
| 1. Log in as Administrator (admin@gmail.com).                                                           |
| 2. Click "Consolidation Report" (or "Performance Report") in the navigation sidebar.                    |
| 3. Select School Year: 2025-2026, Term: 1st Term, and Exam Type: Term Exam.                            |
| 4. Capture the dashboard showing:                                                                       |
|    - The summary statistic cards: Total Sections, Total Examinees, Overall Mean, Overall MPS,           |
|      Overall SD (pooled variance), and Consolidated Mastery Badge.                                      |
|    - The section breakdown table listing individual sections, subject codes, means, and MPS values.     |
+---------------------------------------------------------------------------------------------------------+
```

**Short Description**:
The core administrative Decision Support System (DSS) dashboard. It aggregates examination scores across multiple class sections, grade levels, or the entire school using pooled population variance. Administrators can view performance trends, compare section mastery, identify critical learning deficits, and export clean, formatted reports for institutional presentation.

---

### Screen 4: Classroom Sections Management Screen

```
+---------------------------------------------------------------------------------------------------------+
| [PLACE SCREENSHOT HERE]                                                                                 |
| Screenshot Instructions:                                                                                |
| 1. In the Admin sidebar, click on "Section List" (or "Sections").                                       |
| 2. Select a Grade Level filter (e.g., "Grade 7" or "All Grades").                                      |
| 3. Capture the page showing the section cards/table with Section Name, Grade Level badge,               |
|    Active status indicator, and the "+ Add New Section" button.                                         |
+---------------------------------------------------------------------------------------------------------+
```

**Short Description**:
Enables administrators to create, edit, and organize classroom sections by grade level (Grades 7 to 10) and school year. The system enforces composite uniqueness to prevent duplicate section names and implements referential deletion protection to block deleting any section with existing assessment records.

---

### Screen 5: Faculty Workload Allocation & Sync Matrix Screen

```
+---------------------------------------------------------------------------------------------------------+
| [PLACE SCREENSHOT HERE]                                                                                 |
| Screenshot Instructions:                                                                                |
| 1. In the Admin sidebar, navigate to "Teacher Assignment" (or "Faculty Loads").                         |
| 2. Select a Faculty Member from the dropdown list.                                                      |
| 3. Capture the workload matrix showing the sections and subjects assigned to that teacher,              |
|    along with the "Sync Workload" button and active load counters.                                      |
+---------------------------------------------------------------------------------------------------------+
```

**Short Description**:
Provides a comprehensive matrix for allocating teaching loads to faculty members for the active school year. Administrators can assign section-subject combinations individually or perform bulk synchronization. The backend uses a PostgreSQL partial unique index to prevent conflicting assignments while supporting mid-year substitute teachers.

---

### Screen 6: School Calendar & Term Lifecycle Management Screen

```
+---------------------------------------------------------------------------------------------------------+
| [PLACE SCREENSHOT HERE]                                                                                 |
| Screenshot Instructions:                                                                                |
| 1. In the Admin sidebar, click on "School Calendar" (or "Academic Calendar").                           |
| 2. Capture the card showing the Active School Year (e.g., 2025-2026), its opening and closing dates,    |
|    and the three DepEd terms (1st Term, 2nd Term, 3rd Term) with their respective status badges         |
|    ("Active", "Pending", or "Completed") and status update controls.                                    |
+---------------------------------------------------------------------------------------------------------+
```

**Short Description**:
Controls the institution's academic calendar. Creating a new school year automatically provisions the 3 DepEd terms (`1st Term`, `2nd Term`, `3rd Term`). Administrators can activate terms sequentially, automatically closing previous terms and locking score editing to maintain historical record integrity.

---

### Screen 7: Faculty Accounts & Approval Pipeline Screen

```
+---------------------------------------------------------------------------------------------------------+
| [PLACE SCREENSHOT HERE]                                                                                 |
| Screenshot Instructions:                                                                                |
| 1. In the Admin sidebar, click on "Teacher Accounts" (or "Faculty Management").                         |
| 2. Capture the table displaying registered teachers, showing their Name, Email Address,                |
|    Approval Status ("Approved", "Pending", or "Rejected"), and action buttons (Approve, Reject,         |
|    Deactivate, or Provision Faculty).                                                                   |
+---------------------------------------------------------------------------------------------------------+
```

**Short Description**:
Manages the faculty account lifecycle. Administrators can review pending self-registered faculty applications to approve or reject them, provision active accounts directly, or deactivate accounts when faculty depart while preserving all their historical score sheets and audit data.

---

## Project Structure

The project employs a decoupled architecture comprising a Laravel 11 RESTful API backend and a React 19 Single Page Application frontend.

```
m_capstone/
|-- app/                                      # Application Core (Laravel 11 Backend)
|   |-- Http/
|   |   |-- Controllers/Api/                  # RESTful API Controllers
|   |   |   |-- AcademicReferenceController.php  # Serves cached grade, subject, & year reference data
|   |   |   |-- AssessmentController.php         # Score sheet encoding, ownership, & consolidation
|   |   |   |-- AuthController.php               # Login, registration, token issuance, & profiles
|   |   |   |-- SchoolYearController.php         # Academic year lifecycle & 3-term generation
|   |   |   |-- SectionController.php            # Classroom section CRUD & referential guards
|   |   |   |-- TeacherAssignmentController.php  # Faculty load matrix & atomic workload sync
|   |   |   |-- TeacherController.php            # Teacher directory, approval, & deactivation
|   |   |   `-- TermController.php               # Term status transitions & calendar locking
|   |   |-- Middleware/
|   |   |   `-- EnsureUserHasRole.php            # Role-Based Access Control gate (sanctum tokens)
|   |   |-- Requests/                            # Strict FormRequest Validation Classes
|   |   |   |-- Assessments/StoreAssessmentRequest.php
|   |   |   |-- Assessments/UpdateAssessmentRequest.php
|   |   |   |-- SchoolYears/StoreSchoolYearRequest.php
|   |   |   |-- Sections/StoreSectionRequest.php
|   |   |   `-- TeachingAssignments/SyncTeachingAssignmentRequest.php
|   |   `-- Resources/                           # API Resource Transformers (JSON formatting)
|   |       |-- AssessmentRecordResource.php
|   |       |-- SectionResource.php
|   |       `-- TeachingAssignmentResource.php
|   |-- Models/                               # Eloquent ORM Database Models
|   |   |-- AssessmentRecord.php                 # Exam records with soft deletes & JSON scores
|   |   |-- GradeLevel.php                       # Grades 7 to 10 catalog
|   |   |-- Role.php                             # System admin and Teacher roles
|   |   |-- SchoolYear.php                       # Academic year with active scopes
|   |   |-- Section.php                          # Classroom section entity
|   |   |-- Subject.php                          # DepEd learning areas with curriculum codes
|   |   |-- TeachingAssignment.php               # Faculty load mapping with partial uniqueness
|   |   |-- Term.php                             # DepEd terms (1st, 2nd, 3rd) with status
|   |   `-- User.php                             # Authenticated user with approval statuses
|   `-- Services/
|       `-- StatsCalculatorService.php           # Pure mathematical engine (Mean, SD, MPS, Pooled Variance)
|-- config/
|   `-- cors.php                              # Cross-Origin Resource Sharing for Vercel SPA
|-- database/
|   |-- migrations/                           # Database Schema Definitions & Performance Indexes
|   `-- seeders/                              # Initial Academic Reference & Administrative Seeders
|-- resources/                                # React 19 SPA Frontend
|   |-- css/
|   |   `-- app.css                           # Tailwind CSS v4 design token architecture
|   `-- js/
|       |-- api.js                            # Axios instance with Bearer token injection
|       |-- App.jsx                           # Application shell, auth state, & router tab pane
|       |-- main.jsx                          # React 18/19 DOM root mount & CSS stylesheet import
|       |-- components/
|       |   |-- Sidebar.jsx                   # Collapsible Apple HIG navigation sidebar
|       |   |-- TopBar.jsx                    # User header, current term badge, & logout
|       |   |-- ScoreSheet.jsx                # Interactive spreadsheet score input table
|       |   |-- Modal.jsx                     # Reusable animated modal dialogue
|       |   `-- LoadingIndicator.jsx          # Accessible spinner and skeleton loaders
|       `-- pages/
|           |-- admin/
|           |   |-- TeacherAssignment.jsx     # Workload allocation matrix
|           |   `-- system/
|           |       |-- SchoolCalendar.jsx    # Calendar & term management
|           |       |-- SectionList.jsx       # Classroom sections management
|           |       `-- TeacherAccounts.jsx   # Faculty approval pipeline
|           |-- auth/
|           |   `-- Login.jsx                 # Login and self-registration view
|           |-- reports/
|           |   `-- PerformanceReport.jsx     # Consolidated DSS performance reports
|           `-- teacher/
|               `-- RecordEntry.jsx           # Score sheet encoding workspace
|-- routes/
|   |-- api.php                               # RESTful API routing with Sanctum & RBAC gates
|   `-- web.php                               # API health root endpoint & fallback handler
|-- Dockerfile                                # Pure PHP 8.3 CLI backend container for Render
|-- vercel.json                               # Standalone SPA routing & rewrite rules for Vercel
`-- vite.config.js                            # Dual-mode build supporting standalone SPA and Laravel
```

---

## Database Structure

The relational database is implemented in **PostgreSQL** (hosted on Supabase Cloud) to ensure ACID compliance, strict foreign key referential integrity, and native JSON indexing.

| Table Name | Purpose |
| :--- | :--- |
| `users` | Stores user credentials, hashed passwords, active status, approval status (`pending`, `approved`, `rejected`), and verification timestamps. |
| `roles` | Catalogs system authorization roles (`system_admin` and `teacher`). |
| `role_user` | Normalized junction/pivot table linking users to their assigned roles in a Many-to-Many relationship. |
| `school_years` | Manages academic years (e.g., "2025-2026"), calendar start and end dates, and the active year flag. Soft-deleted for multi-year retention. |
| `terms` | Represents the 3 DepEd academic terms per school year (`1st Term`, `2nd Term`, `3rd Term`) with status tracking (`pending`, `active`, `completed`). |
| `grade_levels` | Static reference catalog for Junior High School levels (Grades 7, 8, 9, and 10). |
| `subjects` | Catalogs DepEd Junior High School learning areas (Mathematics, Science, English, etc.) with standardized curriculum codes (e.g., `MATH-7`, `SCI-8`). |
| `sections` | Classroom cohorts organized by grade level and school year. Protected by composite uniqueness and referential deletion checks. |
| `teaching_assignments` | Maps faculty members to section-subject pairs. Backed by a PostgreSQL partial unique index allowing mid-year substitute teacher reassignment. |
| `assessment_records` | Stores raw examination scores in a native JSON array alongside precalculated descriptive statistics (Mean, SD, MPS, Mastery Level) and least learned competencies. Protected by `restrictOnDelete`. |

---

## ERD Diagram

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

### Relational Cardinality Summary
- **`school_years` to `terms`**: One-to-Many ($1:3$). Creating a school year automatically creates 3 terms.
- **`school_years` to `sections`**: One-to-Many ($1:N$). Sections belong to a specific school year.
- **`grade_levels` to `sections`**: One-to-Many ($1:N$). Each section belongs to exactly one grade level.
- **`grade_levels` to `subjects`**: One-to-Many ($1:8$). Each grade level has 8 standardized learning areas.
- **`users` to `roles`**: Many-to-Many ($M:N$) via `role_user` pivot table.
- **`teaching_assignments`**: Junction entity linking `users` (Teacher), `school_years`, `sections`, and `subjects`.
- **`assessment_records`**: Central fact table referencing `school_years`, `terms`, `grade_levels`, `sections`, `subjects`, and `users` (Teacher).

---

## Challenges and Solutions

### Challenge 1: Statistically Flawed Consolidation (Averaging Standard Deviations)
- **Problem Encountered**: In traditional school spreadsheets, overall standard deviation across multiple sections was calculated by taking the simple average of individual section standard deviations ($\frac{\sigma_1 + \sigma_2}{2}$). This is a well-known mathematical fallacy because standard deviation is non-linear and ignores differences in section sample sizes ($n_i$) and the spread between section means.
- **Solution Implemented**: Engineered `StatsCalculatorService.php` to calculate mathematically rigorous **Pooled Population Variance**:
  $$\sigma^2_{\text{pooled}} = \frac{1}{N} \sum_{i=1}^{k} n_i \left( \sigma_i^2 + (\mu_i - \bar{\mu})^2 \right)$$
  This accounts for both **within-group variance** and **between-group mean dispersion**, providing school administrators with 100% statistically accurate decision support metrics.

---

### Challenge 2: Handling Mid-Year Substitute Teachers without Data Conflicts
- **Problem Encountered**: When a teacher goes on maternity leave or transfers mid-year, a standard database unique constraint on `(school_year_id, section_id, subject_id)` completely blocks assigning a new substitute teacher unless the original assignment is deleted. Deleting the assignment would wipe historical audit trails and orphan past score sheets.
- **Solution Implemented**: Replaced standard unique constraints with a **PostgreSQL Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique
  ON teaching_assignments (school_year_id, section_id, subject_id)
  WHERE effective_until IS NULL;
  ```
  When a teacher leaves, `effective_until` is updated to the current date. The index only enforces uniqueness on rows where `effective_until IS NULL`. This guarantees that only **one teacher is actively assigned** at any given moment, while preserving complete historical records for past teachers.

---

### Challenge 3: Decoupled Multi-Cloud Deployment & Asset Bundling
- **Problem Encountered**: When decoupling the monolithic Laravel Blade setup into a pure PHP backend on Render and a standalone React SPA on Vercel, the production frontend deployed with unstyled HTML (missing CSS) and failed API calls due to CORS pre-flight rejection.
- **Solution Implemented**:
  1. Configured Laravel's `config/cors.php` to allow wildcard Vercel deployment domains (`https://*.vercel.app`) with credentials and standard HTTP methods.
  2. Implemented dual-mode building in `vite.config.js` to emit standalone production SPA assets to `dist/` when building on Vercel.
  3. Added an explicit `import '../css/app.css';` in `resources/js/main.jsx` to ensure Tailwind CSS v4 compiles directly into the standalone bundle and injects the `<link rel="stylesheet">` into `dist/index.html`.

---

## Project Source

- **GitHub Repository**: [https://github.com/krtjhn/DNIHS-Assessment-Consolidation-Analytics-System](https://github.com/krtjhn/DNIHS-Assessment-Consolidation-Analytics-System)
- **Backend API (Render)**: `https://dnihs-assessment-system-api.onrender.com`
- **Frontend SPA (Vercel)**: `https://dnihs-assessment-consolidation-anal.vercel.app`
