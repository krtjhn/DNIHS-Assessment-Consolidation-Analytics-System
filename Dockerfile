# ==============================================================================
# Production Dockerfile for Laravel 12 Backend API on Render (Pure API Server)
# ==============================================================================

FROM php:8.3-cli-alpine
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

# Copy application code into container
COPY . .

# Install production PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions for Laravel storage and cache directories
RUN chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Render injects PORT environment variable (default 10000)
ENV PORT=10000
EXPOSE 10000

# Cache configuration, routes, and start Laravel API server
CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
