<?php

namespace App\Services;

use App\DTOs\DashboardSummaryDTO;
use App\Repositories\DashboardRepository;

class DashboardService
{
    public function __construct(
        private readonly DashboardRepository $dashboardRepository,
    ) {
    }

    public function summary(int $activityLimit): DashboardSummaryDTO
    {
        return new DashboardSummaryDTO(
            activeLiveTables: $this->dashboardRepository->countActiveLiveTables(),
            openTournaments: $this->dashboardRepository->countOpenTournaments(),
            activeRegistrations: $this->dashboardRepository->countActiveRegistrations(),
            totalMembers: $this->dashboardRepository->countMembers(),
            recentTournaments: $this->dashboardRepository->recentTournaments($activityLimit),
        );
    }
}
