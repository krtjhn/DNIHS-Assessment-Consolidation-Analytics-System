<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('term_number'); // 1, 2, 3
            $table->string('name');                      // 'First Term'
            $table->string('status')->default('pending'); // pending, active, completed
            $table->timestamps();

            $table->unique(['school_year_id', 'term_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terms');
    }
};