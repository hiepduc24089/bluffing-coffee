<?php

namespace Database\Seeders;

use App\Enums\DayTypeEnum;
use App\Models\ShiftSetting;
use Illuminate\Database\Seeder;

class ShiftSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'day_type' => DayTypeEnum::Weekday->value,
                'start_time' => '14:00',
                'end_time' => '22:00',
                'max_barista' => 2,
                'max_dealer' => 3,
            ],
            [
                'day_type' => DayTypeEnum::Weekend->value,
                'start_time' => '12:00',
                'end_time' => '22:00',
                'max_barista' => 2,
                'max_dealer' => 3,
            ],
        ];

        // firstOrCreate để chạy lại seeder không ghi đè giờ mở cửa quán đã chỉnh tay.
        foreach ($defaults as $setting) {
            ShiftSetting::query()->firstOrCreate(
                ['day_type' => $setting['day_type']],
                $setting,
            );
        }
    }
}
