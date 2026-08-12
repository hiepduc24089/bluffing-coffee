<?php

namespace App\Repositories;

use App\Enums\TournamentPhaseEnum;
use App\Models\Tournament;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class TournamentRepository
{
    public function paginate(?string $search, ?string $phase, int $perPage): LengthAwarePaginator
    {
        return $this->baseListQuery($search, $phase)
            ->orderByDesc('start_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Mọi giải đấu đều công khai ngay khi tạo: quán không có bước duyệt/công bố.
     */
    public function paginatePublic(?string $search, ?string $phase, int $perPage): LengthAwarePaginator
    {
        return $this->baseListQuery($search, $phase)
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
            ->with(['tournamentTemplate.levels', 'tournamentTemplate.rewards']);
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
    private function baseListQuery(?string $search, ?string $phase): Builder
    {
        return Tournament::query()
            ->with(['tournamentTemplate.levels', 'tournamentTemplate.rewards'])
            ->when($search, function (Builder $query, string $search) {
                $query->where('name', 'like', '%'.$search.'%');
            })
            ->when($phase, function (Builder $query, string $phase) {
                TournamentPhaseEnum::from($phase)->scope($query);
            });
    }
}
