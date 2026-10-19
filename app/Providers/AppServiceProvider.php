<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

// Main service provider for application setup
class AppServiceProvider extends ServiceProvider
{
    // Register any application services
    public function register(): void
    {
        //
    }

    // Bootstrap any application services
    public function boot(): void
    {
        // Enforce HTTPS URLs when running in production or when app URL uses HTTPS
        if ($this->app->environment('production') || str_contains((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }
    }
}
