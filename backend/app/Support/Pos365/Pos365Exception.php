<?php

namespace App\Support\Pos365;

use RuntimeException;

class Pos365Exception extends RuntimeException
{
    public static function notConfigured(): self
    {
        return new self('Chưa cấu hình POS365 (POS365_BASE_URL / POS365_USERNAME / POS365_PASSWORD).');
    }

    public static function loginFailed(int $attempts): self
    {
        return new self("Không đăng nhập được POS365 sau {$attempts} lần thử.");
    }

    public static function requestFailed(string $method, string $path, int $status, string $body): self
    {
        return new self("POS365 {$method} {$path} trả về {$status}: ".mb_substr($body, 0, 300));
    }

    public static function unexpectedPayload(string $path, string $detail): self
    {
        return new self("POS365 {$path} trả về dữ liệu không như mong đợi: {$detail}");
    }
}
