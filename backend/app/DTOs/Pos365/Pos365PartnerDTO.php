<?php

namespace App\DTOs\Pos365;

use App\Support\PhoneNumber;

/**
 * Một khách hàng như POS365 trả về.
 *
 * POS365 lược bỏ hẳn trường có giá trị null khỏi JSON, nên không được dùng
 * `array_key_exists` để suy ra "không có dữ liệu" — thiếu khoá và giá trị rỗng
 * là một.
 */
class Pos365PartnerDTO
{
    /**
     * @param  array<string, mixed>  $raw
     */
    private function __construct(
        public readonly int $id,
        public readonly ?string $code,
        public readonly ?string $name,
        public readonly ?string $phone,
        public readonly ?string $phoneE164,
        public readonly array $raw,
    ) {}

    /**
     * @param  array<string, mixed>  $row
     */
    public static function fromApi(array $row): ?self
    {
        $id = $row['Id'] ?? null;

        // Không có Id thì không có gì để khớp — bản ghi vô dụng.
        if (! is_numeric($id)) {
            return null;
        }

        $phone = self::trimmed($row['Phone'] ?? null) ?? self::trimmed($row['Phone2'] ?? null);

        return new self(
            id: (int) $id,
            code: self::trimmed($row['Code'] ?? null),
            name: self::trimmed($row['Name'] ?? null),
            phone: $phone,
            phoneE164: PhoneNumber::normalize($phone),
            raw: $row,
        );
    }

    public function hasUsablePhone(): bool
    {
        return $this->phoneE164 !== null;
    }

    /**
     * Tên hiển thị khi thu ngân để trống ô tên — vẫn phải có gì đó để admin
     * nhìn ra trong hàng đợi đối soát.
     */
    public function displayName(): string
    {
        return $this->name ?? ($this->code ?? 'POS365 #'.$this->id);
    }

    private static function trimmed(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
