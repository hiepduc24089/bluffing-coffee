#!/usr/bin/env bash
set -euo pipefail

cd /app

# `storage` là named volume nên lần chạy đầu nó rỗng và che mất các thư mục
# đã tạo trong image -> phải tạo lại ở runtime.
mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/app/public \
    storage/logs \
    bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache

if [ -n "${DB_HOST:-}" ]; then
    db_port="${DB_PORT:-3306}"
    echo "Chờ MySQL tại ${DB_HOST}:${db_port} ..."

    for attempt in $(seq 1 60); do
        if mysqladmin ping -h "${DB_HOST}" -P "${db_port}" --silent >/dev/null 2>&1; then
            echo "MySQL đã sẵn sàng."
            break
        fi

        if [ "${attempt}" -eq 60 ]; then
            echo "Không kết nối được MySQL sau 120s." >&2
            exit 1
        fi

        sleep 2
    done
fi

php artisan storage:link --force

php artisan config:cache
php artisan view:cache

# Không chạy `route:cache`: routes/web.php còn closure route (`Route::get('/')`)
# nên Laravel không serialize được. Chuyển route đó sang controller thì bật lại được.

exec "$@"
