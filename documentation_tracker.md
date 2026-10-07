# 📋 Midterm Project Progress & Architecture Documentation Tracker
### Dayap National High School - Calauan Annex Assessment Analytics System (`m_capstone`)

---

## 📌 Executive Summary & Purpose

Ang dokumentong ito ay nagsisilbing **Live Progress Tracker at Technical Guide** para sa iyong **Midterm Defense**. 

Dito nakasaad ang bawat ginagawa natin sa `C:\Users\acer\Documents\BSIT\m_capstone`, kung **ano ang layunin ng bawat file**, at kung **paano ito sumasagot sa 5 Non-Negotiable Academic Requirements** ng iyong panel o propesor.

---

## 🎯 5 Non-Negotiable Midterm Requirements Compliance Table

| Academic Requirement | Paano Natin Na-implement sa `m_capstone`? | Status |
| :--- | :--- | :---: |
| **1. MVC Request Flow** | **Route** (`api.php`) ➔ **Middleware** (`role`, `auth:sanctum`) ➔ **FormRequest** (`StoreSectionRequest`, etc.) ➔ **Controller** (`SectionController`, etc.) ➔ **Model** (`Section`, `AssessmentRecord`) ➔ **React View**. | 🟡 In Progress |
| **2. Clean Migrations & Seeders** | 9 bagong migrations sa PostgreSQL na tumatakbo sa isang command lang: `php artisan migrate:fresh --seed` nang walang lumang patch errors. | 🟢 Completed |
| **3. Validation & Mass Assignment (2 Core Entities)** | • **Entity 1 (Admin)**: `Section` (`sections` table) - Full CRUD.<br>• **Entity 2 (Teacher)**: `AssessmentRecord` (`assessment_records` table) - Full CRUD + Stats. May `$fillable` at Form Requests. | 🟢 Completed (Entity 1 Done) |
| **4. Authentication & Role Checks** | • **Registration**: `POST /api/auth/register`<br>• **Login & Logout**: `POST /api/auth/login`, `POST /api/auth/logout`<br>• **Roles**: `system_admin` at `teacher`<br>• **Route Protection**: `EnsureUserHasRole` middleware. | 🟢 Completed |
| **5. Database Normalization & Key Choices** | 3NF compliant schema, foreign keys na may cascading rules, composite keys sa pivot (`role_user`), at native `json` column para sa raw scores. | 🟢 Completed |

---

## 🗺️ Phase-by-Phase Roadmap & Live Status

```mermaid
gantt
    title Midterm Implementation Progress
    dateFormat  YYYY-MM-DD
    section Backend Core
    Phase 1 Scaffolding & PostgreSQL       :done, p1, 2026-10-07, 1d
    Phase 2 Migrations & Seeders           :done, p2, 2026-10-07, 1d
    Phase 3 Eloquent Models & Relational   :done, p3, 2026-10-07, 1d
    Phase 4 Auth (Register/Login) & RBAC  :done, p4, 2026-10-07, 1d
    Phase 5 Core Entity 1: Section CRUD    :active, p5, 2026-10-07, 1d
    Phase 6 Core Entity 2: Stats & Scoring :p6, 2026-10-07, 1d
    section Frontend & Testing
    Phase 7 React SPA Views (Vite)         :p7, 2026-10-07, 1d
    Phase 8 Defense Verification & Test    :p8, 2026-10-07, 1d
```

---

## 📑 Detalyadong Paliwanag sa Bawat Phase

### ✅ PHASE 1: Scaffolding at Database Setup
- **Ano ang ginawa**:
  - In-initialize ang sariwang Laravel 12 application sa `C:\Users\acer\Documents\BSIT\m_capstone`.
  - Inayos ang `.env` para kumonekta sa bagong PostgreSQL database (`capstone`) sa Port 5433 gamit ang `pdo_pgsql`.
  - In-enable ang `intl` extension sa `C:\Users\acer\php\php.ini` para sa number formatting.
- **Bakit ito ginawa**:
  - Para isolated at ligtas ang luma mong database (`capstone_db`). Walang mabubura sa nauna mong gawa.

---

### ✅ PHASE 2: Migrations at Seeders (`migrate:fresh --seed`)
- **Ano ang ginawa**:
  - Nilikha ang 9 malilinis na migrations:
    1. `create_users_table.php` (may `is_active` boolean para sa soft-deactivation).
    2. `create_roles_table.php` (roles: `system_admin`, `teacher`).
    3. `create_role_user_table.php` (pivot table para sa many-to-many relationship).
    4. `create_grade_levels_table.php` (Grade 7 hanggang 10).
    5. `create_school_years_table.php` (`2025-2026`, active).
    6. `create_terms_table.php` (First, Second, Third Term).
    7. `create_sections_table.php` (Rizal, Bonifacio, etc.).
    8. `create_subjects_table.php` (8 DepEd JHS learning areas).
    9. `create_teaching_assignments_table.php` (pag-tali sa teacher sa section at subject).
    10. `create_assessment_records_table.php` (scores, mean, sd, mps, mastery level, least learned competency).
  - Nilikha ang Seeders: `RoleSeeder`, `UserSeeder`, `AcademicSeeder`, at `DatabaseSeeder`.
- **Bakit ito ginawa**:
  - Upang mapatunayan sa panel na **sa isang pindot lang ng `php artisan migrate:fresh --seed`**, buo agad at may laman ang buong database nang walang manual SQL intervention.

---

### ✅ PHASE 3: Eloquent Models & Relational Architecture
- **Ano ang ginawa**:
  - Nilikha ang 9 Eloquent Models sa `app/Models/`:
    - `User.php`: May `roles()`, `teachingAssignments()`, `hasRole()` method, at `$fillable`.
    - `Role.php`: May `users()` relationship.
    - `GradeLevel.php`: May `sections()` at `subjects()`.
    - `SchoolYear.php`: May `terms()`, `sections()`, at `scopeActive()`.
    - `Term.php`: May `schoolYear()` at `isOpen()` helper.
    - `Section.php`: May `gradeLevel()`, `schoolYear()`, at `scopeActive()`.
    - `Subject.php`: May `gradeLevel()`.
    - `TeachingAssignment.php`: May `teacher()`, `section()`, at `subject()`.
    - `AssessmentRecord.php`: May auto-casting ng `raw_scores` mula JSON papuntang PHP array.
- **Bakit ito ginawa**:
  - **Mass Assignment Protection**: Pinoprotektahan ang database laban sa malicious fields injection gamit ang `$fillable`.
  - **Eloquent Relationships**: Pinapabilis ang pag-query at iniiwasan ang N+1 performance bottleneck.

---

### ✅ PHASE 4: Authentication & Role-Based Access Control (RBAC)
- **Ano ang ginawa**:
  - `RegisterRequest.php`: Tinitiyak na valid ang email, unique, at may confirmed password (minimum 8 characters).
  - `LoginRequest.php`: Vina-validate ang credentials.
  - `AuthController.php`:
    - `register()`: Gumagawa ng user, kinakabitan ng `teacher` role, at nagbabalik ng Sanctum Bearer token.
    - `login()`: Sinusuri ang password hash gamit ang `Hash::check()`, tinitingnan kung `is_active`, at nag-i-issue ng token.
    - `logout()`: Binubura ang token sa database (`personal_access_tokens`).
    - `me()`: Ibinabalik ang user profile at roles.
  - `EnsureUserHasRole.php`: Middleware na humaharang sa non-admin o non-teacher users (`403 Forbidden`).
- **Bakit ito ginawa**:
  - Walang registration ang lumang capstone. Dito sa `m_capstone`, kumpleto ang Login, Logout, at Registration para sa defense!

---

### 🟡 PHASE 5: Core Entity 1 CRUD — Sections Management (Admin)
- **Ano ang ginagawa**:
  - `StoreSectionRequest.php` & `UpdateSectionRequest.php`: Strict validation na bawal magkaroon ng duplicate section name sa parehong grade level at school year.
  - `SectionResource.php`: Ini-standardize ang JSON output format.
  - `SectionController.php`: Kumpletong CRUD operations:
    - `GET /api/sections` (Read: list with grade levels and school year).
    - `POST /api/sections` (Create: Admin only).
    - `GET /api/sections/{id}` (Read: view single section).
    - `PUT /api/sections/{id}` (Update: Admin only).
    - `DELETE /api/sections/{id}` (Delete: Admin only).
  - `AcademicReferenceController.php`: Nagbibigay ng data para sa mga dropdowns sa frontend (Grade Levels, Subjects, School Years).
- **Bakit ito ginawa**:
  - Ito ang **Core Entity 1** na nagpapatunay na gumagana ang CRUD na may Role Protection (Admin lang ang pwedeng mag-add/edit/delete).

---

### ⏳ PHASE 6: Core Entity 2 CRUD — Assessment Scoring & DepEd Stats Engine (Teacher)
- **Ano ang gagawin**:
  - `StatsCalculatorService.php`: Pure PHP statistical computation engine:
    - **Mean**: $\bar{X} = \frac{\sum X}{N}$
    - **Mean Percentage Score (MPS)**: $MPS = \left(\frac{\bar{X}}{\text{Total Items}}\right) \times 100$
    - **Population Standard Deviation (SD)**: $SD = \sqrt{\frac{\sum (X - \bar{X})^2}{N}}$
    - **7-Level DepEd Mastery Classification**: Automatic tag (Mastered, Moving Towards, Average, etc.)
  - `StoreAssessmentRequest.php`: Strict validation sa array ng scores ($0 \le score \le total\_items$).
  - `AssessmentController.php`:
    - `GET /api/assessments` (List scores filtered by section/subject).
    - `POST /api/assessments` (Encode scores, auto-compute stats, at i-save).
    - `PUT /api/assessments/{id}` (Edit scores, auto-recompute stats).
    - `DELETE /api/assessments/{id}` (Delete score sheet).
- **Bakit ito ginawa**:
  - Ito ang **Core Entity 2** at ang **mismong essence ng iyong capstone** na nagpapakita ng automated statistical capability ng system.

---

### ⏳ PHASE 7: React Frontend Views (Vite SPA)
- **Ano ang gagawin**:
  - Decoupled modern frontend (walang Blade):
    - `Login.jsx` & `Register.jsx`
    - `AdminSections.jsx` (UI para sa Entity 1 CRUD)
    - `TeacherAssessments.jsx` (UI para sa Entity 2 CRUD + Live Stats preview)
    - `Navbar.jsx` (may role badge at logout button)
- **Bakit ito ginawa**:
  - Para sa makinis at propesyonal na presentasyon sa panel kung saan live na maipapakita ang bawat feature.

---

### ⏳ PHASE 8: Defense Dry-Run & Verification
- **Ano ang gagawin**:
  - Pagpapatakbo ng automated feature tests (`php artisan test`).
  - Paghahanda ng cheat-sheet para sa posibleng mga tanong ng panel ukol sa MVC, Normalization (3NF), at Sanctum security.

---

*Huling Na-update: 2026-10-07 | Status: Handa na para sa Phase 5 execution.*
