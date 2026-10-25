<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Run the migrations to align PostgreSQL trigger function to official DepEd 7-bracket verbal descriptors
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // 1. Re-define fn_calculate_assessment_metrics() with official DepEd 7-bracket mastery descriptors
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

            // 2. Normalize any pre-existing records to the official DepEd 7-bracket verbal descriptors
            DB::statement("
                UPDATE assessment_records
                SET remarks = CASE
                    WHEN mps >= 96.00 THEN 'Mastered'
                    WHEN mps >= 86.00 THEN 'Closely Approximating Mastery'
                    WHEN mps >= 66.00 THEN 'Moving Towards Mastery'
                    WHEN mps >= 35.00 THEN 'Average'
                    WHEN mps >= 15.00 THEN 'Low'
                    WHEN mps >= 5.00 THEN 'Very Low'
                    ELSE 'Absolutely No Mastery'
                END
                WHERE remarks IS NULL
                   OR TRIM(remarks) = ''
                   OR remarks = 'Complete'
                   OR remarks IN ('Nearly Mastered', 'Low Mastery');
            ");
        }
    }

    // Revert migration by restoring the legacy 3-tier function definition
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared("
                CREATE OR REPLACE FUNCTION fn_calculate_assessment_metrics()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    IF NEW.total_items IS NULL OR NEW.total_items <= 0 THEN
                        RAISE EXCEPTION 'total_items must be greater than zero';
                    END IF;

                    IF NEW.mean > NEW.total_items THEN
                        RAISE EXCEPTION 'mean score cannot exceed total_items';
                    END IF;

                    NEW.mps := ROUND((NEW.mean / NEW.total_items::numeric) * 100.0, 2);

                    IF NEW.remarks IS NULL OR TRIM(NEW.remarks) = '' OR NEW.remarks = 'Complete' THEN
                        IF NEW.mps >= 75.00 THEN
                            NEW.remarks := 'Mastered';
                        ELSIF NEW.mps >= 50.00 THEN
                            NEW.remarks := 'Nearly Mastered';
                        ELSE
                            NEW.remarks := 'Low Mastery';
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql
                SET search_path = public, pg_temp;
            ");
        }
    }
};
