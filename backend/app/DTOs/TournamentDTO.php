<?php

namespace App\DTOs;

use App\Enums\TournamentStatusEnum;
use Carbon\CarbonImmutable;

readonly class TournamentDTO
{
    public function __construct(
        public string $name,
        public int $buyIn,
        public int $capacity,
        public TournamentStatusEnum $status,
        public ?int $rewardProfileId,
        public CarbonImmutable $startAt,
    ) {
    }

    /**
     * @param array{name: string, buyIn: int, capacity: int, status: string, rewardProfileId?: int|null, startAt: string} $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            name: $payload['name'],
            buyIn: (int) $payload['buyIn'],
            capacity: (int) $payload['capacity'],
            status: TournamentStatusEnum::from($payload['status']),
            rewardProfileId: isset($payload['rewardProfileId']) ? (int) $payload['rewardProfileId'] : null,
            startAt: CarbonImmutable::parse($payload['startAt']),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabasePayload(): array
    {
        return [
            'name' => $this->name,
            'buy_in' => $this->buyIn,
            'capacity' => $this->capacity,
            'status' => $this->status->value,
            'reward_profile_id' => $this->rewardProfileId,
            'start_at' => $this->startAt,
        ];
    }
}
