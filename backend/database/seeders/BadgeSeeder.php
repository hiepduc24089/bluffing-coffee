<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Badge::SYSTEM_BADGES as $code => $badge) {
            Badge::query()->updateOrCreate(
                ['code' => $code],
                [
                    ...$badge,
                    'is_system' => true,
                ],
            );
        }
    }
}
