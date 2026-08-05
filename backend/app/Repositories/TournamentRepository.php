<?php

namespace App\Repositories;

use App\Enums\TournamentStatusEnum;
use App\Models\Tournament;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class TournamentRepository
{
    public function paginate(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return $this->baseListQuery($search, $status)
            ->orderByDesc('start_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function paginatePublic(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return $this->baseListQuery($search, $status)
            ->whereIn('status', [
                TournamentStatusEnum::Published->value,
                TournamentStatusEnum::Running->value,
            ])
            ->orderByDesc('start_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @return Builder<Tournament>
     */
    public function publicShowQuery(): Builder
    {
        return Tournament::query()
            ->with(['rewardProfile', 'gameFormat.levels'])
            ->whereIn('status', [
                TournamentStatusEnum::Published->value,
                TournamentStatusEnum::Running->value,
            ]);
    }

    public function create(array $payload): Tournament
    {
        return Tournament::query()->create($payload);
    }

    public function update(Tournament $tournament, array $payload): Tournament
    {
        $tournament->update($payload);

        return $tournament->refresh();
    }

    public function delete(Tournament $tournament): void
    {
        $tournament->delete();
    }

    /**
     * @return Builder<Tournament>
     */
    private function baseListQuery(?string $search, ?string $status): Builder
    {
        return Tournament::query()
            ->with(['rewardProfile', 'gameFormat.levels'])
            ->when($search, function ($query, string $search) {
                $query->where('name', 'like', '%'.$search.'%');
            })
            ->when($status, function ($query, string $status) {
                $query->where('status', $status);
            });
    }
}
