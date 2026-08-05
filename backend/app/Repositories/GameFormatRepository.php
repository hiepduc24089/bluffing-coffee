<?php

namespace App\Repositories;

use App\Models\GameFormat;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class GameFormatRepository
{
    public function paginate(
        ?string $search,
        ?string $tournamentType,
        ?bool $isActive,
        int $perPage,
    ): LengthAwarePaginator {
        return $this->baseListQuery($search, $tournamentType, $isActive)
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @return Collection<int, GameFormat>
     */
    public function allActive(): Collection
    {
        return GameFormat::query()
            ->with('levels')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function find(int $id): ?GameFormat
    {
        return GameFormat::query()->find($id);
    }

    public function findForUpdate(int $id): GameFormat
    {
        return GameFormat::query()
            ->whereKey($id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): GameFormat
    {
        return GameFormat::query()->create($payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(GameFormat $gameFormat, array $payload): GameFormat
    {
        $gameFormat->update($payload);

        return $gameFormat->refresh();
    }

    public function delete(GameFormat $gameFormat): void
    {
        $gameFormat->delete();
    }

    /**
     * @param list<array<string, mixed>> $levels
     */
    public function replaceLevels(GameFormat $gameFormat, array $levels): void
    {
        $gameFormat->levels()->delete();
        $gameFormat->levels()->createMany($levels);
    }

    /**
     * @return Builder<GameFormat>
     */
    private function baseListQuery(?string $search, ?string $tournamentType, ?bool $isActive): Builder
    {
        return GameFormat::query()
            ->with('levels')
            ->when($search, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('name', 'like', '%'.$search.'%')
                        ->orWhere('code', 'like', '%'.$search.'%');
                });
            })
            ->when($tournamentType, function (Builder $query, string $tournamentType) {
                $query->where('tournament_type', $tournamentType);
            })
            ->when($isActive !== null, function (Builder $query) use ($isActive) {
                $query->where('is_active', $isActive);
            });
    }
}
