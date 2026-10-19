# POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
## Calauan Campus
### COMP 016 and COMP 018 Midterm Project

---

## DEVELOPMENT OF A CENTRALIZED ASSESSMENT CONSOLIDATION AND ANALYTICS SYSTEM FOR DAYAP NATIONAL INTEGRATED HIGH SCHOOL

**Members:**
1. Caraig, Kurt John P. sig. _________
2. Austria, Norwin L. sig. _________
3. Bati, Daisuke Reggie C. sig. _________

---

## Project Overview

The **Centralized Assessment Consolidation and Analytics System for Dayap National Integrated High School (DNIHS)** is a web-based educational data management platform and Decision Support System (DSS). Developed under Republic Act No. 10533 (Enhanced Basic Education Act of 2013) and strictly aligned with DepEd Order No. 015, s. 2026 (Revised Guidelines on Classroom Assessment) and DepEd Order No. 009, s. 2026 (Implementation of the Three-Term School Calendar), the platform modernizes periodic examination recording and institutional reporting.

### Context of the Problem
Across public secondary schools under the Schools Division Office (SDO) of Laguna, including Dayap National Integrated High School, assessment data is currently managed using **shared Google Sheets with universal edit permissions**. For each academic year, the school maintains **six (6) separate shared spreadsheet files** to cover baseline diagnostic tests and periodic term examinations across Junior High School (Grades 7 to 10):
1. **Cell Collision & Overwrite Conflicts**: Multiple teachers simultaneously edit shared sheets with unrestricted access, causing teachers to accidentally overwrite, alter, or delete another teacher's encoded scores.
2. **Formula Corruption**: Embedded spreadsheet formulas for Mean, Mean Percentage Score (MPS), and Standard Deviation in summary sheets are directly exposed to users. These formulas are frequently corrupted, deleted, or incorrectly dragged by concurrent encoders.
3. **Absence of Role-Based Access Control (RBAC) & Validation**: Out-of-range scores bypass detection, while any user with the shared link possesses full authority over official school records.
4. **Data Partitioning & Consolidation Bottlenecks**: Because examination datasets are fragmented across six separate spreadsheet files, compiling division-mandated summaries and tracking student mastery across terms requires tedious, error-prone manual copying and cross-sheet aggregation.
5. **Delayed Academic Interventions**: Reporting delays prevent school heads and teachers from promptly identifying least learned competencies, delaying remedial instruction for struggling learners. Furthermore, manual consolidation frequently commits the mathematical fallacy of directly averaging standard deviations across sections of unequal sizes.

### What does the system do?
The centralized web application replaces vulnerable shared spreadsheets with a secured web platform connected to a centralized PostgreSQL database:
- Automates descriptive statistics computation: Total Examinees ($N$), Mean ($\bar{x}$), Mean Percentage Score ($\text{MPS}$), and Population Standard Deviation ($\sigma$).
- Implements the official DepEd 7-Bracket Verbal Mastery Scale (from "Mastered" down to "Absolutely No Mastery").
- Consolidates assessment results across sections, grade levels, and the entire institution using mathematically sound **Pooled Population Variance** ($\sigma^2_{\text{pooled}}$).
- Identifies least learned competencies to drive targeted instructional adjustments.
- Enforces strict server-side Role-Based Access Control (RBAC) via Laravel Sanctum and score range validation ($0 \le \text{score} \le \text{total\_items}$).

### Who benefits?
- **Teachers**: Eliminates clerical calculation burdens in compliance with DepEd Order No. 002, s. 2024 (Removal of Administrative Tasks), automating statistics and protecting score sheets from cell collisions.
- **School Administrators & Academic Coordinators**: Provides real-time visibility into submission progress, consolidated grade-level mastery, and longitudinal performance trends through interactive Decision Support System (DSS) analytics.
- **SDO Laguna & DepEd Sub-Offices**: Delivers uniform, audit-ready reports that eliminate cross-file consolidation discrepancies.

---

## Screens

### Frontend Technical Summary
The user interface is engineered as an interactive Single Page Application (SPA):
- **Core Framework**: React 19 bundled via Vite.
- **Styling Architecture**: Tailwind CSS v4 structured according to Apple Human Interface Guidelines (clean neutral palettes, elevated translucent containers, high contrast typography, and accessible status indicators).
- **Navigation & Motion**: Lucide React icons with Motion animations supporting stateful tab switching (0ms tab restore without remounting).
- **Responsive Layout**: Desktop-first layout with collapsible side navigation and dedicated mobile navigation drawers.

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
The authentication portal for faculty and administrators. Protects school records by verifying user credentials, account activation status (`is_active`), and administrative approval status (`approval_status`). Displays informative alerts if an account is pending approval, deactivated, or rejected. Includes a toggle to access the self-registration form.

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
Replaces vulnerable Google Sheet cells with an interactive spreadsheet-style score sheet. Validates input ranges ($0 \le \text{score} \le \text{total\_items}$) and computes Mean, SD, MPS, and DepEd Mastery Level in real time. Enforces RBAC so teachers only access their assigned classes, prevents overwriting another teacher's submission, and locks editing when the academic term is closed.

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
The administrative Decision Support System (DSS) dashboard. Automatically consolidates assessment records across multiple sections, grade levels, or the entire school using pooled population variance. Eliminates cross-file spreadsheet copying and highlights least learned competencies to inform targeted remedial instruction.

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
Enables administrators to organize classroom sections across Grades 7 to 10 for each academic year. Enforces composite unique constraints to prevent duplicate section naming and applies referential deletion protection to block deleting any section tied to existing assessment records.

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
Manages teaching loads by mapping teachers to section-subject pairs for the active school year. Features batch workload synchronization and leverages a PostgreSQL partial unique index to support mid-year substitute teachers without overwriting past assignment history.

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
Controls the 3-term academic calendar under DepEd Order No. 009, s. 2026. Creating a school year automatically provisions the 3 terms (`1st Term`, `2nd Term`, `3rd Term`). Sequential term activation automatically concludes previous terms and locks historical score sheets to preserve audit integrity.

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
Supervises the teacher account lifecycle. Administrators review self-registered faculty applications, approve or reject them, provision pre-approved accounts, or deactivate departing faculty accounts while keeping all their historical examination score sheets intact.

---

## Project Structure

The project implements a decoupled architecture pairing a Laravel 11 RESTful API backend with a React 19 Single Page Application frontend.

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
- **`school_years` to `terms`**: One-to-Many ($1:3$). Creating a school year automatically provisions 3 terms.
- **`school_years` to `sections`**: One-to-Many ($1:N$). Sections belong to a specific school year.
- **`grade_levels` to `sections`**: One-to-Many ($1:N$). Each section belongs to exactly one grade level.
- **`grade_levels` to `subjects`**: One-to-Many ($1:8$). Each grade level has 8 standardized learning areas.
- **`users` to `roles`**: Many-to-Many ($M:N$) via `role_user` pivot table.
- **`teaching_assignments`**: Junction entity linking `users` (Teacher), `school_years`, `sections`, and `subjects`.
- **`assessment_records`**: Central fact table referencing `school_years`, `terms`, `grade_levels`, `sections`, `subjects`, and `users` (Teacher).

---

## Challenges and Solutions

### Challenge 1: Resolving Division-Wide Google Sheet Cell Collisions & Formula Corruption
- **Problem Encountered**: Under the existing SDO Laguna workflow, teachers shared six Google Sheet files with open edit permissions. Concurrent access routinely caused cell collisions where teachers accidentally overwrote each other's score entries. Furthermore, exposed spreadsheet formulas for Mean, SD, and MPS were frequently dragged over, broken, or deleted.
- **Solution Implemented**: Built a centralized web architecture with server-side calculation and strict authorization:
  1. Relational persistence in PostgreSQL ensures all writes are transactional and isolated.
  2. Encapsulated all mathematical calculations in `StatsCalculatorService.php`, computing statistics on the server so formulas can never be exposed, modified, or corrupted by end-users.
  3. Enforced client- and server-side range validation ($0 \le \text{score} \le \text{total\_items}$) via `StoreAssessmentRequest.php`.

---

### Challenge 2: Statistically Flawed Consolidation (Averaging Standard Deviations)
- **Problem Encountered**: In traditional school spreadsheets, overall standard deviation across multiple sections was calculated by taking the simple average of individual section standard deviations ($\frac{\sigma_1 + \sigma_2}{2}$). This is a well-known mathematical fallacy because standard deviation is non-linear and ignores differences in section sample sizes ($n_i$) and the spread between section means.
- **Solution Implemented**: Implemented mathematically rigorous **Pooled Population Variance**:
  $$\sigma^2_{\text{pooled}} = \frac{1}{N} \sum_{i=1}^{k} n_i \left( \sigma_i^2 + (\mu_i - \bar{\mu})^2 \right)$$
  This accounts for both **within-group variance** and **between-group mean dispersion**, providing school administrators with 100% statistically accurate decision support metrics.

---

### Challenge 3: Handling Mid-Year Substitute Teachers without Data Loss
- **Problem Encountered**: When a teacher goes on leave or transfers mid-year, a standard database unique constraint on `(school_year_id, section_id, subject_id)` completely blocks assigning a substitute teacher unless the original assignment is deleted. Deleting the assignment would destroy historical audit trails and orphan past score sheets.
- **Solution Implemented**: Replaced standard unique constraints with a **PostgreSQL Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX teaching_assignments_sy_sec_subj_active_unique
  ON teaching_assignments (school_year_id, section_id, subject_id)
  WHERE effective_until IS NULL;
  ```
  When a teacher leaves, `effective_until` is updated to the current date. The index only enforces uniqueness on rows where `effective_until IS NULL`. This guarantees that only **one teacher is actively assigned** at any given moment, while preserving complete historical records for past teachers.

---

### Challenge 4: Decoupled Multi-Cloud Deployment & Asset Bundling
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
