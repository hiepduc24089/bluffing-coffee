<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\TournamentRegistration;
use App\Models\UserStatistic;

class UserStatisticService
{
    public function recordTournamentResult(TournamentRegistration $registration, int $bpEarned): void
    {
        $statistic = UserStatistic::query()->firstOrCreate([
            'user_id' => $registration->user_id,
        ]);

        $updates = [
            'total_bp_earned' => $statistic->total_bp_earned + max($bpEarned, 0),
            'tournaments_played' => $statistic->tournaments_played + 1,
            'last_played_at' => now(),
        ];

        if ($registration->final_position === 1) {
            $updates['championships_won'] = $statistic->championships_won + 1;
            $this->applyWinCounter($updates, $statistic, $registration->tournament);
        }

        $statistic->update($updates);
    }

    /**
     * @param array<string, mixed> $updates
     */
    private function applyWinCounter(array &$updates, UserStatistic $statistic, Tournament $tournament): void
    {
        $type = $tournament->tournament_type?->value;
        $name = strtolower($tournament->name);

        if ($type === 'sitngo' || str_contains($name, 'sit') || str_contains($name, 'sng')) {
            $updates['sitngo_wins'] = $statistic->sitngo_wins + 1;
        }

        if ($type === 'turbo' || str_contains($name, 'turbo')) {
            $updates['turbo_wins'] = $statistic->turbo_wins + 1;
        }

        if ($type === 'deepstack' || str_contains($name, 'deepstack') || str_contains($name, 'deep stack')) {
            $updates['deepstack_wins'] = $statistic->deepstack_wins + 1;
        }
    }
}
