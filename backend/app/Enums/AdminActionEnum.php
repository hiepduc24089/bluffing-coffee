<?php

namespace App\Enums;

enum AdminActionEnum: string
{
    case View = 'view';
    case Create = 'create';
    case Update = 'update';
    case Delete = 'delete';

    public function label(): string
    {
        return match ($this) {
            self::View => 'Xem',
            self::Create => 'Thêm',
            self::Update => 'Sửa',
            self::Delete => 'Xóa',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
