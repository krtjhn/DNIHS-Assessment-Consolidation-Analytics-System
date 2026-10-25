<?php

// CLI script to execute PostgreSQL EXPLAIN (ANALYZE, BUFFERS) benchmarks
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

echo "=====================================================================\n";
echo "POSTGRESQL EXPLAIN (ANALYZE, BUFFERS) LIVE DATABASE EXECUTION PLANS\n";
echo "=====================================================================\n\n";

// Helper to run explain and format output
function runExplain(string $title, array $setupStatements, string $querySql): void
{
    echo "---------------------------------------------------------------------\n";
    echo "TEST: {$title}\n";
    echo "---------------------------------------------------------------------\n";

    DB::transaction(function () use ($setupStatements, $querySql) {
        foreach ($setupStatements as $stmt) {
            DB::statement($stmt);
        }
        $rows = DB::select('EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT) '.$querySql);
        foreach ($rows as $row) {
            $prop = 'QUERY PLAN';
            echo ($row->$prop ?? reset($row))."\n";
        }
    });
    echo "\n";
}

// 1A. Assessment Consolidation Query - Sequential Scan (without index)
runExplain(
    '1A: Assessment Records Consolidation Query - Sequential Scan (Forced SeqScan)',
    [
        'SET LOCAL enable_indexscan = off',
        'SET LOCAL enable_bitmapscan = off',
    ],
    "SELECT id, school_year_id, term_id, grade_level_id, section_id, subject_id, type, mean, mps, sd FROM assessment_records WHERE school_year_id = 1 AND term_id = 1 AND type = 'term_exam' AND grade_level_id = 1 AND deleted_at IS NULL"
);

// 1B. Assessment Consolidation Query - Index Scan (Composite Index: assess_records_consolidation_idx)
runExplain(
    '1B: Assessment Records Consolidation Query - Using assess_records_consolidation_idx',
    [
        'SET LOCAL enable_indexscan = on',
        'SET LOCAL enable_bitmapscan = on',
    ],
    "SELECT id, school_year_id, term_id, grade_level_id, section_id, subject_id, type, mean, mps, sd FROM assessment_records WHERE school_year_id = 1 AND term_id = 1 AND type = 'term_exam' AND grade_level_id = 1 AND deleted_at IS NULL"
);

// 2A. Teaching Assignment Query - Sequential Scan
runExplain(
    '2A: Active Teaching Assignment Lookup - Sequential Scan (Forced SeqScan)',
    [
        'SET LOCAL enable_indexscan = off',
        'SET LOCAL enable_bitmapscan = off',
    ],
    'SELECT id, user_id, school_year_id, section_id, subject_id, effective_from FROM teaching_assignments WHERE school_year_id = 1 AND section_id = 1 AND subject_id = 1 AND effective_until IS NULL'
);

// 2B. Teaching Assignment Query - Partial Unique Index Scan
runExplain(
    '2B: Active Teaching Assignment Lookup - Using teaching_assignments_sy_sec_subj_active_unique',
    [
        'SET LOCAL enable_indexscan = on',
        'SET LOCAL enable_bitmapscan = on',
    ],
    'SELECT id, user_id, school_year_id, section_id, subject_id, effective_from FROM teaching_assignments WHERE school_year_id = 1 AND section_id = 1 AND subject_id = 1 AND effective_until IS NULL'
);

// 3. User Approval Status Query - Index Scan
runExplain(
    '3: User Pending Faculty Approval Status - Filter by users_approval_status_idx',
    [
        'SET LOCAL enable_indexscan = on',
        'SET LOCAL enable_bitmapscan = on',
    ],
    "SELECT id, name, email, approval_status, created_at FROM users WHERE approval_status = 'pending' AND deleted_at IS NULL"
);
