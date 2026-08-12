<?php

namespace App\DTOs;

readonly class TournamentTemplateRewardDTO
{
    public function __construct(
        public int $position,
        public int $bpReward,
    ) {
    }

    /**
     * @param array{position: int, bpReward: int} $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            position: (int) $payload['position'],
            bpReward: (int) $payload['bpReward'],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabasePayload(): array
    {
        return [
            'position' => $this->position,
            'bp_reward' => $this->bpReward,
        ];
    }
}
