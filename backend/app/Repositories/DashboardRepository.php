<?php

namespace App\Repositories;

use App\Enums\TournamentRegistrationStatusEnum;
use App\Enums\TournamentStatusEnum;
use App\Enums\UserRoleEnum;
use App\Models\LiveTable;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class DashboardRepository
{
    public function countActiveLiveTables(): int
    {
        return LiveTable::query()
            ->whereHas('currentTournament', function (Builder $query) {
                $query->where('status', TournamentStatusEnum::Running->value);
            })
            ->count();
    }

    public function countOpenTournaments(): int
    {
        return Tournament::query()
            ->whereIn('status', $this->openStatuses())
            ->count();
    }

    public function countActiveRegistrations(): int
    {
        return TournamentRegistration::query()
            ->where('status', TournamentRegistrationStatusEnum::Registered->value)
            ->whereHas('tournament', function (Builder $query) {
                $query->whereIn('status', $this->openStatuses());
            })
            ->count();
    }

    public function countMembers(): int
    {
        return User::query()
            ->where('role', UserRoleEnum::Member->value)
            ->count();
    }

    /**
     * @return Collection<int, Tournament>
     */
    public function recentTournaments(int $limit): Collection
    {
        return Tournament::query()
            ->with('liveTables')
            ->withCount([
                'registrations as registered_count' => function (Builder $query) {
                    $query->where('status', TournamentRegistrationStatusEnum::Registered->value);
                },
            ])
            ->orderByDesc('start_at')
            ->limit($limit)
            ->get();
    }

    /**
     * @return array<int, string>
     */
    private function openStatuses(): array
    {
        return [
            TournamentStatusEnum::Published->value,
            TournamentStatusEnum::Running->value,
        ];
    }
}
