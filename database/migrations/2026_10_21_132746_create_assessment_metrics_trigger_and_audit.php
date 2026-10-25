<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Run the migrations to establish PostgreSQL functions, triggers, and full-metrics audit log table
    public function up(): void
    {
        // 1. Create assessment_audit_logs table with complete statistical snapshot columns
        if (! Schema::hasTable('assessment_audit_logs')) {
            Schema::create('assessment_audit_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('assessment_id')->nullable()->constrained('assessment_records')->nullOnDelete();
                $table->string('action', 20);
                $table->decimal('old_mean', 8, 2)->nullable();
                $table->decimal('new_mean', 8, 2)->nullable();
                $table->decimal('old_mps', 8, 2)->nullable();
                $table->decimal('new_mps', 8, 2)->nullable();
                $table->decimal('old_sd', 8, 2)->nullable();
                $table->decimal('new_sd', 8, 2)->nullable();
                $table->decimal('old_highest_score', 8, 2)->nullable();
                $table->decimal('new_highest_score', 8, 2)->nullable();
                $table->decimal('old_lowest_score', 8, 2)->nullable();
                $table->decimal('new_lowest_score', 8, 2)->nullable();
                $table->unsignedInteger('old_no_of_entries')->nullable();
                $table->unsignedInteger('new_no_of_entries')->nullable();
                $table->string('old_remarks')->nullable();
                $table->string('new_remarks')->nullable();
                $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 2. Define PostgreSQL-specific functions and triggers
        if (DB::getDriverName() === 'pgsql') {
            // Function to automatically compute MPS and set mastery remarks
            DB::unprepared("
                CREATE OR REPLACE FUNCTION fn_calculate_assessment_metrics()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    -- Validate domain integrity
                    IF NEW.total_items IS NULL OR NEW.total_items <= 0 THEN
                        RAISE EXCEPTION 'total_items must be greater than zero';
                    END IF;

                    IF NEW.mean > NEW.total_items THEN
                        RAISE EXCEPTION 'mean score cannot exceed total_items';
                    END IF;

                    -- Automatically calculate accurate MPS
                    NEW.mps := ROUND((NEW.mean / NEW.total_items::numeric) * 100.0, 2);

                    -- Automatically assign official DepEd 7-bracket mastery remarks if unassigned, placeholder, or previous descriptor
                    IF NEW.remarks IS NULL 
                       OR TRIM(NEW.remarks) = '' 
                       OR NEW.remarks = 'Complete' 
                       OR NEW.remarks IN (
                           'Mastered', 
                           'Closely Approximating Mastery', 
                           'Moving Towards Mastery', 
                           'Average', 
                           'Low', 
                           'Very Low', 
                           'Absolutely No Mastery',
                           'Nearly Mastered', 
                           'Low Mastery'
                       ) THEN
                        IF NEW.mps >= 96.00 THEN
                            NEW.remarks := 'Mastered';
                        ELSIF NEW.mps >= 86.00 THEN
                            NEW.remarks := 'Closely Approximating Mastery';
                        ELSIF NEW.mps >= 66.00 THEN
                            NEW.remarks := 'Moving Towards Mastery';
                        ELSIF NEW.mps >= 35.00 THEN
                            NEW.remarks := 'Average';
                        ELSIF NEW.mps >= 15.00 THEN
                            NEW.remarks := 'Low';
                        ELSIF NEW.mps >= 5.00 THEN
                            NEW.remarks := 'Very Low';
                        ELSE
                            NEW.remarks := 'Absolutely No Mastery';
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql
                SET search_path = public, pg_temp;
            ");

            // Attach trigger to assessment_records table
            DB::unprepared('
                DROP TRIGGER IF EXISTS trg_assessment_records_before_insert_or_update ON assessment_records;
                CREATE TRIGGER trg_assessment_records_before_insert_or_update
                BEFORE INSERT OR UPDATE ON assessment_records
                FOR EACH ROW
                EXECUTE FUNCTION fn_calculate_assessment_metrics();
            ');

            // Function to log updates and deletions with full statistical snapshot
            DB::unprepared("
                CREATE OR REPLACE FUNCTION fn_audit_assessment_records()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    IF (TG_OP = 'UPDATE') THEN
                        INSERT INTO assessment_audit_logs (
                            assessment_id, 
                            action, 
                            old_mean, new_mean, 
                            old_mps, new_mps, 
                            old_sd, new_sd, 
                            old_highest_score, new_highest_score, 
                            old_lowest_score, new_lowest_score, 
                            old_no_of_entries, new_no_of_entries, 
                            old_remarks, new_remarks, 
                            teacher_id, 
                            created_at
                        )
                        VALUES (
                            OLD.id, 
                            'UPDATE', 
                            OLD.mean, NEW.mean, 
                            OLD.mps, NEW.mps, 
                            OLD.sd, NEW.sd, 
                            OLD.highest_score, NEW.highest_score, 
                            OLD.lowest_score, NEW.lowest_score, 
                            OLD.no_of_entries, NEW.no_of_entries, 
                            OLD.remarks, NEW.remarks, 
                            NEW.teacher_id, 
                            CURRENT_TIMESTAMP
                        );
                        RETURN NEW;
                    ELSIF (TG_OP = 'DELETE') THEN
                        INSERT INTO assessment_audit_logs (
                            assessment_id, 
                            action, 
                            old_mean, new_mean, 
                            old_mps, new_mps, 
                            old_sd, new_sd, 
                            old_highest_score, new_highest_score, 
                            old_lowest_score, new_lowest_score, 
                            old_no_of_entries, new_no_of_entries, 
                            old_remarks, new_remarks, 
                            teacher_id, 
                            created_at
                        )
                        VALUES (
                            OLD.id, 
                            'DELETE', 
                            OLD.mean, NULL, 
                            OLD.mps, NULL, 
                            OLD.sd, NULL, 
                            OLD.highest_score, NULL, 
                            OLD.lowest_score, NULL, 
                            OLD.no_of_entries, NULL, 
                            OLD.remarks, NULL, 
                            OLD.teacher_id, 
                            CURRENT_TIMESTAMP
                        );
                        RETURN OLD;
                    END IF;
                    RETURN NULL;
                END;
                \$\$ LANGUAGE plpgsql;
            ");

            // Attach audit trigger to assessment_records table
            DB::unprepared('
                DROP TRIGGER IF EXISTS trg_assessment_audit_logger ON assessment_records;
                CREATE TRIGGER trg_assessment_audit_logger
                AFTER UPDATE OR DELETE ON assessment_records
                FOR EACH ROW
                EXECUTE FUNCTION fn_audit_assessment_records();
            ');
        }
    }

    // Reverse the migrations
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared('
                DROP TRIGGER IF EXISTS trg_assessment_audit_logger ON assessment_records;
                DROP FUNCTION IF EXISTS fn_audit_assessment_records();
                DROP TRIGGER IF EXISTS trg_assessment_records_before_insert_or_update ON assessment_records;
                DROP FUNCTION IF EXISTS fn_calculate_assessment_metrics();
            ');
        }

        Schema::dropIfExists('assessment_audit_logs');
    }
};
