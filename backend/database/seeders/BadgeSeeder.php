<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            ['code' => 'FIRST_WIN', 'name' => 'First Win', 'description' => 'Won the first tournament.'],
            ['code' => 'TEN_TOURNAMENTS', 'name' => '10 Tournaments', 'description' => 'Played 10 tournaments.'],
            ['code' => 'CHAMPION', 'name' => 'Champion', 'description' => 'Won a tournament.'],
            ['code' => 'DEEPSTACK_WINNER', 'name' => 'DeepStack Winner', 'description' => 'Won a DeepStack event.'],
            ['code' => 'TURBO_KING', 'name' => 'Turbo King', 'description' => 'Won a Turbo event.'],
            ['code' => 'SITNGO_REGULAR', 'name' => 'Sit & Go Regular', 'description' => 'A regular Sit & Go player.'],
        ];

        foreach ($badges as $badge) {
            Badge::query()->firstOrCreate(
                ['code' => $badge['code']],
                $badge,
            );
        }
    }
}
