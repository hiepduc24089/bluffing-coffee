<?php

namespace App\Services;

use App\DTOs\TournamentDTO;
use App\Models\Tournament;
use App\Repositories\TournamentRepository;
use App\Repositories\TournamentTemplateRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TournamentService
{
    public function __construct(
        private readonly TournamentRepository $tournamentRepository,
        private readonly TournamentTemplateRepository $tournamentTemplateRepository,
    ) {
    }

    public function paginate(?string $search, ?string $phase, int $perPage): LengthAwarePaginator
    {
        return $this->tournamentRepository->paginate($search, $phase, $perPage);
    }

    public function paginatePublic(?string $search, ?string $phase, int $perPage): LengthAwarePaginator
    {
        return $this->tournamentRepository->paginatePublic($search, $phase, $perPage);
    }

    public function findPublic(string $id): Tournament
    {
        return $this->tournamentRepository->publicShowQuery()->findOrFail($id);
    }

    public function create(TournamentDTO $dto): Tournament
    {
        return DB::transaction(function () use ($dto) {
            return $this->tournamentRepository->create(
                $this->syncTypeWithTemplate($dto->toDatabasePayload()),
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
                $this->syncTypeWithTemplate($dto->toDatabasePayload()),
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
     * whichever template staff selected instead of drifting apart from it.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function syncTypeWithTemplate(array $payload): array
    {
        if (empty($payload['tournament_template_id'])) {
            return $payload;
        }

        $template = $this->tournamentTemplateRepository->find((int) $payload['tournament_template_id']);

        if ($template === null) {
            return $payload;
        }

        $payload['tournament_type'] = $template->tournament_type->value;

        return $payload;
    }
}
