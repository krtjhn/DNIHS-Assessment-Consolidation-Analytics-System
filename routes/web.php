<?php

use Illuminate\Support\Facades\Route;

// Serve the frontend Single Page Application (React) on root URL
Route::get('/', function () {
    return view('welcome'); // Return the welcome Blade view that mounts the React frontend
});

// Fallback route to redirect all unmatched web URLs to the React app
Route::fallback(function () {
    return view('welcome'); // Route all non-API web paths back to React client-side router
});
