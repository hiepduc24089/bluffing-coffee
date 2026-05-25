FROM php:8.3-fpm-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
        $PHPIZE_DEPS \
        bash \
        curl \
        git \
        icu-dev \
        libzip-dev \
        linux-headers \
        mysql-client \
        oniguruma-dev \
        unzip \
        zip \
    && docker-php-ext-install \
        bcmath \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo_mysql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/bluffing-coffee.ini
COPY docker/php/entrypoint.sh /usr/local/bin/bluffing-coffee-entrypoint

RUN chmod +x /usr/local/bin/bluffing-coffee-entrypoint

ENTRYPOINT ["bluffing-coffee-entrypoint"]
CMD ["php-fpm"]
