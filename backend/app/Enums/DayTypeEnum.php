<?php

namespace App\Enums;

use Carbon\CarbonInterface;

enum DayTypeEnum: string
{
    case Weekday = 'weekday';
    case Weekend = 'weekend';

    public function label(): string
    {
        return match ($this) {
            self::Weekday => 'Ngày thường',
            self::Weekend => 'Cuối tuần',
        };
    }

    public static function fromDate(CarbonInterface $date): self
    {
        return $date->isWeekend() ? self::Weekend : self::Weekday;
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
