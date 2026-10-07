<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('terms')->cascadeOnDelete();
            $table->foreignId('grade_level_id')->constrained('grade_levels')->restrictOnDelete();
            $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();

            $table->string('type')->default('diagnostic'); 
            $table->unsignedInteger('total_items')->default(50);
            $table->json('raw_scores');
            $table->unsignedInteger('no_of_entries')->default(0);
            $table->decimal('mean', 8, 2)->default(0.00);
            $table->decimal('mps', 8, 2)->default(0.00);
            $table->decimal('sd', 8, 2)->default(0.00);
            $table->decimal('highest_score', 8, 2)->nullable();
            $table->decimal('lowest_score', 8, 2)->nullable();
            $table->text('least_learned_competency')->nullable();
            $table->string('remarks')->nullable()->default('Complete');
            $table->timestamps();

            $table->unique(
                ['school_year_id', 'term_id', 'section_id', 'subject_id', 'type'],
                'assess_sy_term_sec_subj_type_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_records');
    }
};