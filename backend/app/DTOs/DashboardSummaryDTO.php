<?php

namespace App\DTOs;

use App\Models\Tournament;
use Illuminate\Support\Collection;

readonly class DashboardSummaryDTO
{
    /**
     * @param Collection<int, Tournament> $recentTournaments
     */
    public function __construct(
        public int $activeLiveTables,
        public int $openTournaments,
        public int $activeRegistrations,
        public int $totalMembers,
        public Collection $recentTournaments,
    ) {
    }
}
