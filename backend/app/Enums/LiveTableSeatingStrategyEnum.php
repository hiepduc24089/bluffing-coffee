<?php

namespace App\Enums;

/**
 * Cách chia ghế cho người chơi được chuyển sang bàn đích khi gom bàn.
 */
enum LiveTableSeatingStrategyEnum: string
{
    /** Bốc thăm — đúng luật poker khi vỡ bàn, tránh tranh cãi vị trí. */
    case Random = 'random';

    /** Điền ghế trống từ nhỏ đến lớn, dùng khi chủ giải muốn kiểm soát vị trí. */
    case Sequential = 'sequential';

    public function label(): string
    {
        return match ($this) {
            self::Random => 'Bốc thăm ngẫu nhiên',
            self::Sequential => 'Xếp lần lượt vào ghế trống',
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
