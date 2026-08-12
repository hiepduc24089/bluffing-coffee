<?php

namespace App\Services;

use App\DTOs\TournamentTemplateDTO;
use App\Models\TournamentTemplate;
use App\Repositories\TournamentTemplateRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TournamentTemplateService
{
    public function __construct(
        private readonly TournamentTemplateRepository $tournamentTemplateRepository,
    ) {
    }

    public function paginate(?string $search, ?string $tournamentType, int $perPage): LengthAwarePaginator
    {
        return $this->tournamentTemplateRepository->paginate($search, $tournamentType, $perPage);
    }

    /**
     * @return Collection<int, TournamentTemplate>
     */
    public function allTemplates(): Collection
    {
        return $this->tournamentTemplateRepository->all();
    }

    public function create(TournamentTemplateDTO $dto): TournamentTemplate
    {
        return DB::transaction(function () use ($dto) {
            $template = $this->tournamentTemplateRepository->create($dto->toDatabasePayload());
            $this->tournamentTemplateRepository->replaceLevels($template, $dto->toLevelPayloads());
            $this->tournamentTemplateRepository->replaceRewards($template, $dto->toRewardPayloads());

            return $template->load(['levels', 'rewards']);
        });
    }

    public function update(TournamentTemplate $template, TournamentTemplateDTO $dto): TournamentTemplate
    {
        return DB::transaction(function () use ($template, $dto) {
            $lockedTemplate = $this->tournamentTemplateRepository->findForUpdate($template->getKey());

            $this->tournamentTemplateRepository->update($lockedTemplate, $dto->toDatabasePayload());
            $this->tournamentTemplateRepository->replaceLevels($lockedTemplate, $dto->toLevelPayloads());
            $this->tournamentTemplateRepository->replaceRewards($lockedTemplate, $dto->toRewardPayloads());

            return $lockedTemplate->load(['levels', 'rewards']);
        });
    }

    /**
     * Clone an existing template so staff can tweak a variant without retyping every
     * blind level and reward tier.
     */
    public function duplicate(TournamentTemplate $template): TournamentTemplate
    {
        return DB::transaction(function () use ($template) {
            $source = $this->tournamentTemplateRepository
                ->findForUpdate($template->getKey())
                ->load(['levels', 'rewards']);

            $copy = $this->tournamentTemplateRepository->create([
                ...$source->only([
                    'name',
                    'tournament_type',
                    'starting_stack',
                    'late_reg_until_level',
                    'max_rebuy',
                    'rebuy_stack',
                    'description',
                    'default_price_with_drink',
                    'default_price_without_drink',
                ]),
                'name' => $this->buildCopyName($source->name),
                'code' => $this->buildAvailableCode($source->code),
            ]);

            $this->tournamentTemplateRepository->replaceLevels(
                $copy,
                $source->levels
                    ->map(fn ($level) => $level->only([
                        'position',
                        'level_number',
                        'small_blind',
                        'big_blind',
                        'ante',
                        'duration_minutes',
                        'is_break',
                        'note',
                    ]))
                    ->all(),
            );

            $this->tournamentTemplateRepository->replaceRewards(
                $copy,
                $source->rewards
                    ->map(fn ($reward) => $reward->only(['position', 'bp_reward']))
                    ->all(),
            );

            return $copy->load(['levels', 'rewards']);
        });
    }

    public function delete(TournamentTemplate $template): void
    {
        DB::transaction(function () use ($template) {
            $lockedTemplate = $this->tournamentTemplateRepository->findForUpdate($template->getKey());

            if ($lockedTemplate->tournaments()->exists()) {
                throw ValidationException::withMessages([
                    'tournamentTemplate' => 'Không thể xóa mẫu giải đấu đang được giải đấu sử dụng.',
                ]);
            }

            $this->tournamentTemplateRepository->delete($lockedTemplate);
        });
    }

    private function buildCopyName(string $name): string
    {
        return mb_substr($name.' (Bản sao)', 0, 255);
    }

    private function buildAvailableCode(string $code): string
    {
        $base = mb_substr($code, 0, 90).'_COPY';
        $candidate = $base;
        $suffix = 1;

        while (TournamentTemplate::query()->where('code', $candidate)->exists()) {
            $suffix++;
            $candidate = $base.'_'.$suffix;
        }

        return $candidate;
    }
}
