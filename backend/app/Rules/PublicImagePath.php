<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PublicImagePath implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            $fail('Đường dẫn ảnh không hợp lệ.');
            return;
        }

        if (! $this->isAllowed(trim($value))) {
            $fail('Đường dẫn ảnh phải là path nội bộ hoặc URL https hợp lệ.');
        }
    }

    private function isAllowed(string $value): bool
    {
        $normalized = strtolower($value);

        if (
            str_contains($value, '..') ||
            str_starts_with($normalized, 'data:') ||
            str_starts_with($normalized, 'javascript:')
        ) {
            return false;
        }

        if (str_starts_with($normalized, 'https://')) {
            return filter_var($value, FILTER_VALIDATE_URL) !== false;
        }

        if (str_starts_with($value, '/storage/')) {
            return preg_match('/\A\/storage\/[A-Za-z0-9._~\/-]+\z/', $value) === 1;
        }

        return preg_match('/\A[A-Za-z0-9][A-Za-z0-9._~\/-]*\z/', $value) === 1;
    }
}
