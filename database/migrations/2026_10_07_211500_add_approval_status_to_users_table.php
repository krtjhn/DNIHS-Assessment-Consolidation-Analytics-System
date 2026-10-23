<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Run the migrations
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('approval_status')->default('approved')->after('is_active');
            $table->timestamp('approved_at')->nullable()->after('approval_status');
        });
    }

    // Reverse the migrations
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['approval_status', 'approved_at']);
        });
    }
};
