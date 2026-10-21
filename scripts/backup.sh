#!/bin/bash
# DNIHS Automated Database Backup Script (Bash for Linux/macOS Cron)
# Usage: ./scripts/backup.sh

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

cd "$PROJECT_ROOT"
php artisan db:backup
