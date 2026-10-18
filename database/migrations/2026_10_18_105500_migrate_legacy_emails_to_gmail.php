<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate all legacy email accounts (e.g. @dayapnhs.edu.ph, @dnihs, etc.) to @gmail.com
        $legacyUsers = DB::table('users')
            ->where('email', 'not like', '%@gmail.com')
            ->get();

        foreach ($legacyUsers as $user) {
            $username = explode('@', $user->email)[0];
            $newEmail = strtolower($username) . '@gmail.com';

            // Prevent duplicate constraint violation
            $exists = DB::table('users')->where('email', $newEmail)->where('id', '!=', $user->id)->exists();
            if ($exists) {
                $newEmail = strtolower($username) . '_' . $user->id . '@gmail.com';
            }

            DB::table('users')->where('id', $user->id)->update([
                'email' => $newEmail,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // No reversal since institutional custom domains are discontinued
    }
};
