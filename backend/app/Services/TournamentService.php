<?php

namespace App\Services;

use App\DTOs\TournamentDTO;
use App\Models\Tournament;
use App\Repositories\GameFormatRepository;
use App\Repositories\TournamentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TournamentService
{
    public function __construct(
        private readonly TournamentRepository $tournamentRepository,
        private readonly GameFormatRepository $gameFormatRepository,
    ) {
    }

    public function paginate(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return $this->tournamentRepository->paginate($search, $status, $perPage);
    }

    public function paginatePublic(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return $this->tournamentRepository->paginatePublic($search, $status, $perPage);
    }

    public function findPublic(string $id): Tournament
    {
        return $this->tournamentRepository->publicShowQuery()->findOrFail($id);
    }

    public function create(TournamentDTO $dto): Tournament
    {
        return DB::transaction(function () use ($dto) {
            return $this->tournamentRepository->create(
                $this->syncTypeWithGameFormat($dto->toDatabasePayload()),
            );
        });
    }

    public function update(Tournament $tournament, TournamentDTO $dto): Tournament
    {
        return DB::transaction(function () use ($tournament, $dto) {
            $lockedTournament = Tournament::query()
                ->whereKey($tournament->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            return $this->tournamentRepository->update(
                $lockedTournament,
                $this->syncTypeWithGameFormat($dto->toDatabasePayload()),
            );
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

    /**
     * The coarse tournament type still drives statistics and badges, so it must follow
     * whichever game format staff selected instead of drifting apart from it.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function syncTypeWithGameFormat(array $payload): array
    {
        if (empty($payload['game_format_id'])) {
            return $payload;
        }

        $gameFormat = $this->gameFormatRepository->find((int) $payload['game_format_id']);

        if ($gameFormat === null) {
            return $payload;
        }

        $payload['tournament_type'] = $gameFormat->tournament_type->value;

        return $payload;
    }
}
