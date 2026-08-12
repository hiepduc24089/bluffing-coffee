<?php

namespace App\DTOs;

use App\Enums\TournamentTypeEnum;

readonly class TournamentTemplateDTO
{
    /**
     * @param list<TournamentTemplateLevelDTO> $levels
     * @param list<TournamentTemplateRewardDTO> $rewards
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
        public int $defaultPriceWithDrink,
        public int $defaultPriceWithoutDrink,
        public array $levels,
        public array $rewards,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        $levels = array_values($payload['levels'] ?? []);
        $rewards = array_values($payload['rewards'] ?? []);

        return new self(
            name: $payload['name'],
            code: $payload['code'],
            tournamentType: TournamentTypeEnum::from($payload['tournamentType'] ?? TournamentTypeEnum::Normal->value),
            startingStack: (int) $payload['startingStack'],
            lateRegUntilLevel: isset($payload['lateRegUntilLevel']) ? (int) $payload['lateRegUntilLevel'] : null,
            maxRebuy: isset($payload['maxRebuy']) ? (int) $payload['maxRebuy'] : null,
            rebuyStack: isset($payload['rebuyStack']) ? (int) $payload['rebuyStack'] : null,
            description: $payload['description'] ?? null,
            defaultPriceWithDrink: (int) ($payload['defaultPriceWithDrink'] ?? 0),
            defaultPriceWithoutDrink: (int) ($payload['defaultPriceWithoutDrink'] ?? 0),
            levels: array_map(
                static fn (array $level, int $index) => TournamentTemplateLevelDTO::fromArray($level, $index + 1),
                $levels,
                array_keys($levels),
            ),
            rewards: array_map(
                static fn (array $reward) => TournamentTemplateRewardDTO::fromArray($reward),
                $rewards,
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
            'default_price_with_drink' => $this->defaultPriceWithDrink,
            'default_price_without_drink' => $this->defaultPriceWithoutDrink,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function toLevelPayloads(): array
    {
        return array_map(
            static fn (TournamentTemplateLevelDTO $level) => $level->toDatabasePayload(),
            $this->levels,
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function toRewardPayloads(): array
    {
        return array_map(
            static fn (TournamentTemplateRewardDTO $reward) => $reward->toDatabasePayload(),
            $this->rewards,
        );
    }
}
