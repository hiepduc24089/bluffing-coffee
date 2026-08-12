<?php

namespace App\Repositories;

use App\Models\TournamentTemplate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class TournamentTemplateRepository
{
    public function paginate(
        ?string $search,
        ?string $tournamentType,
        int $perPage,
    ): LengthAwarePaginator {
        return $this->baseListQuery($search, $tournamentType)
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @return Collection<int, TournamentTemplate>
     */
    public function all(): Collection
    {
        return TournamentTemplate::query()
            ->with(['levels', 'rewards'])
            ->orderBy('name')
            ->get();
    }

    public function find(int $id): ?TournamentTemplate
    {
        return TournamentTemplate::query()->find($id);
    }

    public function findForUpdate(int $id): TournamentTemplate
    {
        return TournamentTemplate::query()
            ->whereKey($id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): TournamentTemplate
    {
        return TournamentTemplate::query()->create($payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(TournamentTemplate $template, array $payload): TournamentTemplate
    {
        $template->update($payload);

        return $template->refresh();
    }

    public function delete(TournamentTemplate $template): void
    {
        $template->delete();
    }

    /**
     * @param list<array<string, mixed>> $levels
     */
    public function replaceLevels(TournamentTemplate $template, array $levels): void
    {
        $template->levels()->delete();
        $template->levels()->createMany($levels);
    }

    /**
     * @param list<array<string, mixed>> $rewards
     */
    public function replaceRewards(TournamentTemplate $template, array $rewards): void
    {
        $template->rewards()->delete();
        $template->rewards()->createMany($rewards);
    }

    /**
     * @return Builder<TournamentTemplate>
     */
    private function baseListQuery(?string $search, ?string $tournamentType): Builder
    {
        return TournamentTemplate::query()
            ->with(['levels', 'rewards'])
            ->when($search, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('name', 'like', '%'.$search.'%')
                        ->orWhere('code', 'like', '%'.$search.'%');
                });
            })
            ->when($tournamentType, function (Builder $query, string $tournamentType) {
                $query->where('tournament_type', $tournamentType);
            });
    }
}
