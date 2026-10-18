# Consolidation & Analytics System

An automated DepEd-aligned student assessment consolidation and analytics platform for tracking student mastery levels, computing Mean, Standard Deviation (SD), and Mean Percentage Score (MPS), and generating institutional performance reports.

---

## Features

- **Strict Academic Term Alignment**: Tailored specifically for DepEd Philippine Junior High School curriculum (Grade 7 to 10) across a 3-term academic system (`1st Term`, `2nd Term`, `3rd Term`).
- **Role-Based Access Control**:
  - **Administrator**: School Calendar, Grade & Section Management, Teacher Assignment, Faculty Accounts, and School-Wide Consolidated Reports.
  - **Teacher**: Subject & Section encoding, Excel-like real-time score entry with instant validation, and section evaluation.
- **Instant Client-Side Score Validation**: Real-time validation preventing inputs that exceed total examination items, highlighting errors with live reactive feedback.
- **Qualitative Assessment Tracking**: Recording and consolidation of least learned competencies and teacher intervention plans.
- **DepEd Mastery Categorization**: Automated distribution across standard DepEd classifications (Mastered, Closely Approximating, Moving Towards, Average, Low, Very Low, No Mastery).

---

## Tech Stack

- **Backend**: Laravel 12, PHP 8.2+, Laravel Sanctum
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Motion
- **Database**: PostgreSQL (Supabase) / SQLite for local development

---

## Installation & Setup

### 1. Prerequisites
- PHP 8.2 or higher
- Composer 2.x
- Node.js 20+ & npm

### 2. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd m_capstone

# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install
```

### 3. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

Configure your `.env` database parameters:
```env
DB_CONNECTION=pgsql
DB_HOST=your-database-host
DB_PORT=5432
DB_DATABASE=your-database-name
DB_USERNAME=your-database-user
DB_PASSWORD=your-database-password
DB_SSLMODE=require
```

### 4. Database Migrations & Seeders
```bash
# Run database migrations and seed default DepEd academic metadata
php artisan migrate --seed
```

---

## Running the Application

### Development Server
Run the Laravel backend and Vite frontend development servers concurrently:
```bash
# Terminal 1: Backend
php artisan serve

# Terminal 2: Frontend
npm run dev
```

### Production Build
Compile and bundle production-optimized assets:
```bash
npm run build
```

---

## Running Tests

Execute automated feature and unit tests:
```bash
php artisan test
```

---

## License

This project is proprietary and intended for institutional assessment management.
