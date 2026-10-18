<?php

// Declare strict PHP syntax for application root service provider

namespace App\Providers;

// Import base ServiceProvider class from Illuminate support package
use Illuminate\Support\ServiceProvider;

// AppServiceProvider configures application-wide dependency injection bindings and bootstrap routines
class AppServiceProvider extends ServiceProvider
{
    // Register application services and IoC container singleton bindings
    public function register(): void
    {
        // Register custom interface-to-implementation service container bindings here if needed
    }

    // Bootstrap application services, model event observers, and database schema configurations
    public function boot(): void
    {
        // Global model event listeners, morph maps, and pagination defaults can be initialized here
    }
}
