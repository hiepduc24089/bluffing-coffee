<?php

namespace App\Enums;

use App\Models\ShiftSetting;
use Carbon\CarbonInterface;

/**
 * Ca full là trọn giờ mở cửa, early/late là hai nửa ca dành cho part-time. Vì
 * hai loại ngày đều chia đôi chẵn (8h → 4h, 10h → 5h) nên chỉ cần điểm giữa.
 */
enum ShiftSlotEnum: string
{
    case Full = 'full';
    case Early = 'early';
    case Late = 'late';

    /** Full-time là trọn giờ mở cửa, Part-time ca 1/ca 2 là hai nửa — cách quán gọi khi xếp lịch. */
    public function label(): string
    {
        return match ($this) {
            self::Full => 'Full-time',
            self::Early => 'Part-time ca 1',
            self::Late => 'Part-time ca 2',
        };
    }

    /**
     * @return array{start: CarbonInterface, end: CarbonInterface}
     */
    public function rangeOn(CarbonInterface $date, ShiftSetting $setting): array
    {
        $opensAt = $setting->opensAtOn($date);
        $closesAt = $setting->closesAtOn($date);
        $midpoint = $opensAt->copy()->addMinutes((int) ($opensAt->diffInMinutes($closesAt) / 2));

        return match ($this) {
            self::Full => ['start' => $opensAt, 'end' => $closesAt],
            self::Early => ['start' => $opensAt, 'end' => $midpoint],
            self::Late => ['start' => $midpoint, 'end' => $closesAt],
        };
    }

    /**
     * Full chồng lên mọi slot; early và late thì không đụng nhau. Dùng để đếm
     * số người có mặt cùng lúc khi kiểm tra sức chứa.
     */
    public function overlaps(self $other): bool
    {
        return $this === self::Full || $other === self::Full || $this === $other;
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
