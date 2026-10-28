# Project Documentation

## Project Overview

The DNIHS Assessment Consolidation and Analytics System is a web application built with Laravel (PHP 8.3), React 19, Tailwind CSS, and PostgreSQL for recording, computing, and consolidating periodic exam and diagnostic test scores for Grades 7 to 10 at Dayap National Integrated High School. Teachers log in to encode raw student scores and least learned competencies for their assigned classes, and the system automatically computes the class Mean, Standard Deviation, Mean Percentage Score (MPS), and DepEd Mastery Level. On the admin side, the system manages school years, terms, sections, teacher accounts, and class loads, and automatically combines all submitted class records into a single consolidated performance report. It solves the issues of using shared spreadsheets (such as accidental score overwrites, broken formulas, and slow manual consolidation), making score recording faster for teachers and giving school administrators a clear view of student performance across all grade levels and subjects.

---

## Screens

### Front-End Overview
The front-end is developed as a Single Page Application (SPA) built with React 19 and bundled using Vite. It utilizes Tailwind CSS v4 for modern utility-first styling, Lucide React for UI iconography, and Motion for component animations and page transitions.

### Screen Descriptions

#### 1. Login
![Login](docs/screenshots/01-login.png)

Shows the DNIHS login card where teachers and administrators enter their email address and password to access the system. It includes a show/hide password button and a link at the bottom for new teachers who need to register an account.

#### 2. Create Faculty Account
![Create Faculty Account](docs/screenshots/02-register.png)

Allows new faculty members to register by entering their full name, email address, password, and password confirmation. Newly created teacher accounts are saved with a pending status until the System Administrator approves them.

#### 3. Consolidated Reports
![Consolidated Reports](docs/screenshots/03-consolidated-reports.png)

Displays the consolidated examination report table for the school, showing the number of cases, highest and lowest scores, mean, standard deviation, MPS, and the number of students under each of the 7 DepEd Mastery brackets per subject. Administrators can click the filter button on the upper right to filter results by assessment type (Term Exam or Diagnostic Test), school year, term, grade level, section, and subject.

#### 4. Section Management
![Section Management](docs/screenshots/04-section-management.png)

Lists all classroom sections for the selected school year along with their grade level and status. From this screen, the administrator can add new sections, archive existing ones, or delete sections that do not have encoded assessment records yet.

#### 5. Class Assignments
![Class Assignments](docs/screenshots/05-class-assignments.png)

Lets the administrator assign teaching loads to faculty members. Selecting a teacher from the list on the left displays their current schedule on the right, where the administrator can assign a new grade level, section, and subject or remove an existing class load.

#### 6. School Calendar
![School Calendar](docs/screenshots/06-school-calendar.png)

Used by the administrator to manage school years and control when teachers can encode scores. The top panel shows the three terms of the selected school year and lets the admin set each term to Active (open for encoding) or Pending/Completed (locked), while the bottom table lists all school years and lets the admin add a new school year.

#### 7. Teacher Accounts
![Teacher Accounts](docs/screenshots/07-teacher-accounts.png)

Shows all registered faculty accounts with filters for All, Pending, Active, and Removed accounts. Administrators can search for teachers, add a new faculty account directly, approve or reject pending registrations, or remove a teacher's access without deleting their past class records.

#### 8. Teacher Record Entry
![Teacher Record Entry](docs/screenshots/08-teacher-record-entry-list.png)

The main screen for logged-in teachers. It lists all classes assigned to the teacher for the current school year and term, grouped under Assigned, Missing, and Done tabs so teachers can easily track which class exams still need to be encoded.

#### 9. Teacher Student Score Encoding - New Entry
![Teacher Student Score Encoding New Entry](docs/screenshots/09-teacher-score-encoding-new.png)

Opens when a teacher selects a class that has no encoded scores yet. Teachers set the total number of test items, type each student's raw score into the table, enter the least learned competency on the right panel, and click Submit to save the record and automatically compute the class statistics.

#### 10. Teacher Student Score Encoding - Update / Delete
![Teacher Student Score Encoding Update](docs/screenshots/10-teacher-score-encoding-update.png)

Opens when a teacher selects a class that already has saved scores. While the term is still open, the teacher can edit student scores, update the least learned competency, and click Update to recompute the results, or click Delete to remove the submission.

---

## Project Structure

The project is structured as a Laravel REST API backend (PHP 8.3) connected to a React 19 frontend and a PostgreSQL database.

```text
m_capstone/
├── app/
│   ├── Console/Commands/
│   │   ├── DatabaseBackupCommand.php       # Database backup command
│   │   └── DatabaseRestoreCommand.php      # Database restore verification
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AcademicReferenceController.php  # Grade levels & subjects API
│   │   │   ├── AssessmentController.php    # Score encoding & reports
│   │   │   ├── AuthController.php          # Auth & user session API
│   │   │   ├── SchoolYearController.php    # School year & term management
│   │   │   ├── SectionController.php       # Class section management
│   │   │   ├── TeacherAssignmentController.php  # Teacher load assignments
│   │   │   ├── TeacherController.php       # Teacher accounts & approval
│   │   │   └── TermController.php          # Term status management
│   │   ├── Middleware/
│   │   │   └── EnsureUserHasRole.php       # Role access authorization
│   │   ├── Requests/                       # Form validation classes
│   │   └── Resources/                      # JSON API resource transformers
│   ├── Models/                             # Eloquent database models
│   │   ├── AssessmentRecord.php
│   │   ├── GradeLevel.php
│   │   ├── Role.php
│   │   ├── SchoolYear.php
│   │   ├── Section.php
│   │   ├── Subject.php
│   │   ├── TeachingAssignment.php
│   │   ├── Term.php
│   │   └── User.php
│   └── Services/
│       └── StatsCalculatorService.php      # Mean, SD, MPS calculator
├── bootstrap/
│   └── app.php                             # Application bootloader
├── config/                                 # App & database configuration
├── database/
│   └── migrations/                         # PostgreSQL table schemas
├── public/                                 # Web server entry & assets
├── resources/
│   ├── css/
│   │   └── app.css                         # Tailwind CSS stylesheet
│   └── js/
│       ├── api.js                          # Axios API client helper
│       ├── App.jsx                         # Root React SPA component
│       ├── main.jsx                        # React entry point
│       ├── components/                     # Reusable UI components
│       └── pages/                          # React page views & modules
└── routes/
    ├── api.php                             # REST API endpoints
    ├── console.php                         # Scheduled CLI commands
    └── web.php                             # SPA route entry point
```

### Functions Made
- `StatsCalculatorService::calculate($rawScores, $totalItems)`: Takes the array of student scores and total items, then computes the number of examinees, mean, population standard deviation, MPS, highest/lowest score, and the DepEd mastery description.
- `StatsCalculatorService::consolidate($records)`: Combines assessment records across multiple sections or grade levels and computes the overall standard deviation using pooled population variance.
- `StatsCalculatorService::getMasteryLevel($mps)`: Returns the matching DepEd mastery level bracket for a given MPS value.
- `AssessmentController::store()`, `update()`, and `consolidation()`: Checks if the term is open and if the teacher is assigned to the class before saving scores, and queries filtered records for the admin's consolidated report.
- `AuthController::login()`, `register()`, and `logout()`: Validates user login credentials, checks if a teacher account is approved and active, creates new teacher registrations, and manages Sanctum tokens.
- `TeacherAssignmentController::syncTeacher()`: Updates a teacher's assigned classes for the school year inside a database transaction.
- `fn_calculate_assessment_metrics()` and `fn_audit_assessment_records()`: PostgreSQL trigger functions that validate the mean against total items, compute MPS and mastery remarks in the database, and log any score changes or deletions into `assessment_audit_logs`.

---

## Database Structure

| Table Name | Purpose |
| :--- | :--- |
| `users` | Stores administrator and teacher accounts, hashed passwords, active status (`is_active`), approval status (`pending`, `approved`, `rejected`), and timestamps. |
| `roles` | Defines authorization roles (`system_admin` and `teacher`). |
| `role_user` | Pivot table that links `users` to their assigned `roles`. |
| `school_years` | Stores academic school years (such as `2025-2026`), start and end dates, and active school year status (`is_active`). |
| `terms` | Stores the 3 grading terms (`1st Term`, `2nd Term`, `3rd Term`) per school year and encoding status (`pending`, `active`, `completed`). |
| `grade_levels` | Reference table for junior high school levels (`Grade 7`, `Grade 8`, `Grade 9`, and `Grade 10`). |
| `sections` | Stores class sections under a specific grade level and school year. |
| `subjects` | Stores the DepEd curriculum learning areas per grade level along with their subject codes. |
| `teaching_assignments` | Links a teacher (`user_id`) to a specific section and subject for a school year, including tenure dates (`effective_from`, `effective_until`). |
| `assessment_records` | Stores examination records with raw score arrays (`raw_scores` JSON), total items, computed statistics (`no_of_entries`, `mean`, `mps`, `sd`, highest/lowest score), least learned competencies, and DepEd mastery remarks. |
| `assessment_audit_logs` | Audit trail logging previous and updated statistical values whenever an assessment record is modified or deleted. |
| `personal_access_tokens` | Stores hashed Laravel Sanctum Bearer tokens for authenticated API sessions. |
| `password_reset_tokens` | Stores temporary security tokens for user password reset requests. |
| `sessions` | Stores web user session state, IP addresses, user agents, and last activity timestamps. |
| `failed_jobs` | Logs details of any background queued jobs that failed execution. |

---

## ERD Diagram

![Entity-Relationship Diagram](docs/screenshots/erd.png)

---

## Challenges and Solutions

### 1.
- **Problem**: Each section has a different number of students (e.g., 35 in one section, 48 in another). Creating a separate database row for every single student's score made database queries slow and bloated the database with thousands of rows.
- **Solution**: We stored the list of raw student scores in a native PostgreSQL `JSON` column inside `assessment_records` and used Laravel Eloquent's array casting (`$casts = ['raw_scores' => 'array']`), allowing the backend to save and retrieve scores directly as a standard PHP array.

### 2.
- **Problem**: Relying only on browser validation was risky because modified or corrupted requests could submit scores that were negative, non-numeric, or higher than the test's total number of items.
- **Solution**: We created a dedicated Laravel `StoreAssessmentRequest` validation class that verifies every item in the submitted array (`raw_scores.* => 'required|numeric|min:0|lte:total_items'`) before allowing the data to reach the database.

### 3.
- **Problem**: If a teacher submitted scores for the same section, subject, and term more than once, the database could create duplicate records, which corrupted the school-wide consolidated report totals.
- **Solution**: We created a composite unique index in PostgreSQL covering `(school_year_id, term_id, section_id, subject_id, type)` and programmed the controller to check for existing entries so it updates the current record instead of inserting a duplicate.

### 4.
- **Problem**: Writing statistical formulas (Mean, MPS, Standard Deviation, and Mastery Level) directly inside multiple controllers created duplicated code and risked slight differences in how numbers were calculated across reports.
- **Solution**: We isolated all statistical logic into a standalone `StatsCalculatorService` class, ensuring that single-class submissions and consolidated multi-section reports use the exact same calculation methods.
