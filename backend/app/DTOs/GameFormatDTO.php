<?php

namespace App\DTOs;

use App\Enums\TournamentTypeEnum;

readonly class GameFormatDTO
{
    /**
     * @param list<GameFormatLevelDTO> $levels
     */
    public function __construct(
        public string $name,
        public string $code,
        public TournamentTypeEnum $tournamentType,
        public int $startingStack,
        public ?int $lateRegUntilLevel,
        public ?int $maxRebuy,
        public ?int $rebuyStack,
        public ?string $description,
        public bool $isActive,
        public array $levels,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        $levels = array_values($payload['levels'] ?? []);

        return new self(
            name: $payload['name'],
            code: $payload['code'],
            tournamentType: TournamentTypeEnum::from($payload['tournamentType'] ?? TournamentTypeEnum::Normal->value),
            startingStack: (int) $payload['startingStack'],
            lateRegUntilLevel: isset($payload['lateRegUntilLevel']) ? (int) $payload['lateRegUntilLevel'] : null,
            maxRebuy: isset($payload['maxRebuy']) ? (int) $payload['maxRebuy'] : null,
            rebuyStack: isset($payload['rebuyStack']) ? (int) $payload['rebuyStack'] : null,
            description: $payload['description'] ?? null,
            isActive: (bool) ($payload['isActive'] ?? true),
            levels: array_map(
                static fn (array $level, int $index) => GameFormatLevelDTO::fromArray($level, $index + 1),
                $levels,
                array_keys($levels),
            ),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabasePayload(): array
    {
        return [
            'name' => $this->name,
            'code' => $this->code,
            'tournament_type' => $this->tournamentType->value,
            'starting_stack' => $this->startingStack,
            'late_reg_until_level' => $this->lateRegUntilLevel,
            'max_rebuy' => $this->maxRebuy,
            'rebuy_stack' => $this->rebuyStack,
            'description' => $this->description,
            'is_active' => $this->isActive,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function toLevelPayloads(): array
    {
        return array_map(
            static fn (GameFormatLevelDTO $level) => $level->toDatabasePayload(),
            $this->levels,
        );
    }
}
