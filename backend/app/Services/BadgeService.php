<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\User;
use App\Models\UserStatistic;

class BadgeService
{
    public function awardForStatistics(User $user, UserStatistic $statistic): void
    {
        if ($statistic->championships_won >= 1) {
            $this->award($user, 'FIRST_WIN', 'First Win', 'Won the first tournament.');
            $this->award($user, 'CHAMPION', 'Champion', 'Won a tournament.');
        }

        if ($statistic->tournaments_played >= 10) {
            $this->award($user, 'TEN_TOURNAMENTS', '10 Tournaments', 'Played 10 tournaments.');
        }

        if ($statistic->deepstack_wins >= 1) {
            $this->award($user, 'DEEPSTACK_WINNER', 'DeepStack Winner', 'Won a DeepStack event.');
        }

        if ($statistic->turbo_wins >= 1) {
            $this->award($user, 'TURBO_KING', 'Turbo King', 'Won a Turbo event.');
        }
    }

    private function award(User $user, string $code, string $name, string $description): void
    {
        $badge = Badge::query()->firstOrCreate(
            ['code' => $code],
            [
                'name' => $name,
                'description' => $description,
            ],
        );

        $user->badges()->syncWithoutDetaching([
            $badge->id => ['earned_at' => now()],
        ]);
    }
}
