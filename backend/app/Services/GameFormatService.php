<?php

namespace App\Services;

use App\DTOs\GameFormatDTO;
use App\Models\GameFormat;
use App\Repositories\GameFormatRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GameFormatService
{
    public function __construct(
        private readonly GameFormatRepository $gameFormatRepository,
    ) {
    }

    public function paginate(?string $search, ?string $tournamentType, ?bool $isActive, int $perPage): LengthAwarePaginator
    {
        return $this->gameFormatRepository->paginate($search, $tournamentType, $isActive, $perPage);
    }

    /**
     * @return Collection<int, GameFormat>
     */
    public function activeFormats(): Collection
    {
        return $this->gameFormatRepository->allActive();
    }

    public function create(GameFormatDTO $dto): GameFormat
    {
        return DB::transaction(function () use ($dto) {
            $gameFormat = $this->gameFormatRepository->create($dto->toDatabasePayload());
            $this->gameFormatRepository->replaceLevels($gameFormat, $dto->toLevelPayloads());

            return $gameFormat->load('levels');
        });
    }

    public function update(GameFormat $gameFormat, GameFormatDTO $dto): GameFormat
    {
        return DB::transaction(function () use ($gameFormat, $dto) {
            $lockedFormat = $this->gameFormatRepository->findForUpdate($gameFormat->getKey());

            $this->gameFormatRepository->update($lockedFormat, $dto->toDatabasePayload());
            $this->gameFormatRepository->replaceLevels($lockedFormat, $dto->toLevelPayloads());

            return $lockedFormat->load('levels');
        });
    }

    /**
     * Clone an existing structure so staff can tweak a variant without retyping every blind level.
     */
    public function duplicate(GameFormat $gameFormat): GameFormat
    {
        return DB::transaction(function () use ($gameFormat) {
            $source = $this->gameFormatRepository->findForUpdate($gameFormat->getKey())->load('levels');

            $copy = $this->gameFormatRepository->create([
                ...$source->only([
                    'name',
                    'tournament_type',
                    'starting_stack',
                    'late_reg_until_level',
                    'max_rebuy',
                    'rebuy_stack',
                    'description',
                ]),
                'name' => $this->buildCopyName($source->name),
                'code' => $this->buildAvailableCode($source->code),
                'is_active' => false,
            ]);

            $this->gameFormatRepository->replaceLevels(
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

            return $copy->load('levels');
        });
    }

    public function delete(GameFormat $gameFormat): void
    {
        DB::transaction(function () use ($gameFormat) {
            $lockedFormat = $this->gameFormatRepository->findForUpdate($gameFormat->getKey());

            if ($lockedFormat->tournaments()->exists()) {
                throw ValidationException::withMessages([
                    'gameFormat' => 'Không thể xóa chế độ chơi đang được giải đấu sử dụng.',
                ]);
            }

            $this->gameFormatRepository->delete($lockedFormat);
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

        while (GameFormat::query()->where('code', $candidate)->exists()) {
            $suffix++;
            $candidate = $base.'_'.$suffix;
        }

        return $candidate;
    }
}
