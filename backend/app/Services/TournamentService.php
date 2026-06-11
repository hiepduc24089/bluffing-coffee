<?php

namespace App\Services;

use App\DTOs\TournamentDTO;
use App\Models\Tournament;
use App\Repositories\TournamentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TournamentService
{
    public function __construct(
        private readonly TournamentRepository $tournamentRepository,
    ) {
    }

    public function paginate(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return $this->tournamentRepository->paginate($search, $status, $perPage);
    }

    public function create(TournamentDTO $dto): Tournament
    {
        return DB::transaction(function () use ($dto) {
            return $this->tournamentRepository->create($dto->toDatabasePayload());
        });
    }

    public function update(Tournament $tournament, TournamentDTO $dto): Tournament
    {
        return DB::transaction(function () use ($tournament, $dto) {
            $lockedTournament = Tournament::query()
                ->whereKey($tournament->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            return $this->tournamentRepository->update($lockedTournament, $dto->toDatabasePayload());
        });
    }

    public function delete(Tournament $tournament): void
    {
        DB::transaction(function () use ($tournament) {
            $lockedTournament = Tournament::query()
                ->whereKey($tournament->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $this->tournamentRepository->delete($lockedTournament);
        });
    }

}
