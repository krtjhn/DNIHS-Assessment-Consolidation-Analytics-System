<?php

use Illuminate\Support\Facades\Schedule;

// Automated database backup schedule (Runs nightly at 2:00 AM with overlapping protection)
Schedule::command('db:backup')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground();
