# ==============================================================================
# Multi-stage Dockerfile for Laravel 12 + Vite React SPA on Render (Free Tier)
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: PHP 8.3 Production Runtime
FROM php:8.3-cli-alpine AS backend
WORKDIR /var/www/html

# Install required system packages and PostgreSQL PDO extension for Supabase
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql zip pcntl

# Install Composer from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . .

# Copy compiled frontend assets from Stage 1
COPY --from=frontend /app/public/build ./public/build

# Install production PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set up write permissions for Laravel storage and cache directories
RUN chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Render injects the PORT environment variable (default 10000)
ENV PORT=10000
EXPOSE 10000

# Cache configuration, routes, views, and start Laravel web server
CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
