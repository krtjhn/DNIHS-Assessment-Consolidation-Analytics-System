<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseConnectionTest extends TestCase
{
    // Override actor provisioning to keep connection tests ultra fast
    protected function ensureTestActorsExist(): void
    {
        // Schema and connection tests do not require mock actors
    }

    // Verify database connection uses PostgreSQL driver
    public function test_database_connection_driver_is_postgresql(): void
    {
        $driver = DB::connection()->getDriverName();
        $this->assertEquals('pgsql', $driver, 'The application database driver must be PostgreSQL.');
    }

    // Verify active database server version is modern PostgreSQL 17 or higher
    public function test_postgresql_version_is_current_and_supported(): void
    {
        $versionResult = DB::select('SELECT version() as pg_version');
        $this->assertNotEmpty($versionResult);
        $rawVersion = $versionResult[0]->pg_version;

        $this->assertStringContainsString('PostgreSQL', $rawVersion);
        $this->assertTrue(
            str_contains($rawVersion, 'PostgreSQL 17') || str_contains($rawVersion, 'PostgreSQL 18'),
            'Database engine should be modern PostgreSQL 17+ on Supabase Cloud.'
        );
    }

    // Verify all 11 core application tables exist in the public schema
    public function test_all_core_tables_exist_in_public_schema(): void
    {
        $expectedTables = [
            'users',
            'roles',
            'role_user',
            'school_years',
            'terms',
            'grade_levels',
            'sections',
            'subjects',
            'teaching_assignments',
            'assessment_records',
            'assessment_audit_logs',
        ];

        $existingTables = DB::table('pg_tables')
            ->where('schemaname', 'public')
            ->pluck('tablename')
            ->toArray();

        foreach ($expectedTables as $table) {
            $this->assertContains(
                $table,
                $existingTables,
                "Database schema must contain the '{$table}' table."
            );
        }
    }

    // Verify PL/pgSQL stored procedures and triggers exist
    public function test_stored_procedures_and_triggers_exist(): void
    {
        // 1. Verify metric calculation function
        $calcFunc = DB::select(
            "SELECT proname FROM pg_proc WHERE proname = 'fn_calculate_assessment_metrics'"
        );
        $this->assertNotEmpty($calcFunc, 'Stored function fn_calculate_assessment_metrics must exist.');

        // 2. Verify audit logging function
        $auditFunc = DB::select(
            "SELECT proname FROM pg_proc WHERE proname = 'fn_audit_assessment_records'"
        );
        $this->assertNotEmpty($auditFunc, 'Stored function fn_audit_assessment_records must exist.');

        // 3. Verify triggers attached to assessment_records table
        $triggers = DB::select(
            "SELECT tgname FROM pg_trigger WHERE tgname IN ('trg_assessment_records_before_insert_or_update', 'trg_assessment_audit_logger')"
        );
        $triggerNames = array_map(fn ($t) => $t->tgname, $triggers);

        $this->assertContains(
            'trg_assessment_records_before_insert_or_update',
            $triggerNames,
            'Automated metric pre-computation trigger must be active on assessment_records.'
        );
        $this->assertContains(
            'trg_assessment_audit_logger',
            $triggerNames,
            'Audit logging trigger must be active on assessment_records.'
        );
    }

    // Verify transaction rollback isolation operates reliably
    public function test_database_transactions_function_properly(): void
    {
        $initialCount = DB::table('school_years')->count();

        try {
            DB::transaction(function () use ($initialCount) {
                DB::table('school_years')->insert([
                    'name' => '2098-2099',
                    'start_date' => '2098-06-01',
                    'end_date' => '2099-03-31',
                    'is_active' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->assertEquals($initialCount + 1, DB::table('school_years')->count());

                // Deliberately trigger rollback inside transaction block
                throw new \RuntimeException('Trigger rollback for assertion test');
            });
        } catch (\RuntimeException $e) {
            // Expected exception to verify rollback
        }

        $this->assertEquals($initialCount, DB::table('school_years')->count(), 'Transaction rollback must restore exact original row count.');
    }
}
