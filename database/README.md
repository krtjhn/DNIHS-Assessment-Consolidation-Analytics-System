# DNIHS Decision Support System — Database Operations & Architecture Guide

Welcome to the Database Architecture repository for the Digos National High School (DNIHS) Assessment Consolidation and Analytics System.

---

## 1. Quick Command Reference

### Database Migrations & Deterministic Master Data
```powershell
# Run all schema migrations and provision official DepEd core master data
php artisan migrate

# Check migration status
php artisan migrate:status
```

### Automated Backup & Disaster Recovery
```powershell
# 1. Generate live PostgreSQL backup dump with SHA-256 checksum
php artisan db:backup

# 2. Verify backup data fidelity and prove restore capabilities to evaluation panel
php artisan db:restore --verify-only

# 3. Restore specific backup dump into active database
php artisan db:restore database/backups/dnihs_proven_backup.sql --force
```

### PostgreSQL EXPLAIN ANALYZE Performance Benchmarks
```powershell
# Run live execution plan benchmarks against Supabase PostgreSQL 17.11
php scripts/run_benchmarks.php
```

---

## 2. Key Architectural Deliverables

| Deliverable Document | Location | Purpose |
| :--- | :--- | :--- |
| **Master Architecture & Defense Guide** | [`docs/DATABASE_ARCHITECTURE_AND_DEFENSE.md`](file:///c:/Users/acer/Documents/BSIT/m_capstone/docs/DATABASE_ARCHITECTURE_AND_DEFENSE.md) | Complete Mermaid ERD, Data Dictionary, 3NF Formal Proof, and 12-Question Panel Defense Cheat Sheet. |
| **EXPLAIN ANALYZE Performance Report** | [`docs/EXPLAIN_ANALYZE_REPORT.md`](file:///c:/Users/acer/Documents/BSIT/m_capstone/docs/EXPLAIN_ANALYZE_REPORT.md) | Query execution plans, cost models, and B-Tree index optimization evidence (-78.9% and -90.2% cost reduction). |
| **Disaster Recovery Guide** | [`docs/BACKUP_AND_RESTORE_GUIDE.md`](file:///c:/Users/acer/Documents/BSIT/m_capstone/docs/BACKUP_AND_RESTORE_GUIDE.md) | Step-by-step backup storage structure, task scheduler configuration (2:00 AM daily), and restore verification. |

---

## 3. Core Database Specifications

- **Engine**: PostgreSQL 17.11 (Supabase Cloud — AWS Tokyo `ap-northeast-1`)
- **Connection**: `aws-0-ap-northeast-1.pooler.supabase.com:5432` (SSL Mode: `require`, TLS 1.3)
- **Procedural Logic**:
  - `fn_calculate_assessment_metrics()` & `trg_assessment_records_before_insert_or_update`: Automated MPS calculation & DepEd remarks assignment.
  - `fn_audit_assessment_records()` & `trg_assessment_audit_logger`: Real-time forensic change tracking on `assessment_records`.
- **Security & RLS**:
  - Row-Level Security (RLS) enabled on all 20 public tables.
  - PostgreSQL Roles: `dnihs_admin_role` (DBA) and `dnihs_teacher_staff` (Restricted DML, strictly NO `DELETE` on academic records).
  - Search Path locked to `public, pg_temp` to prevent CVE execution hijacking.
