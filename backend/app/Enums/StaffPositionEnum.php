<?php

namespace App\Enums;

/**
 * Vị trí đứng quầy, dùng cho cả hồ sơ nhân viên lẫn màu hiển thị trên lịch.
 */
enum StaffPositionEnum: string
{
    case Barista = 'barista';
    case Dealer = 'dealer';

    public function label(): string
    {
        return match ($this) {
            self::Barista => 'Pha chế',
            self::Dealer => 'Dealer',
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
