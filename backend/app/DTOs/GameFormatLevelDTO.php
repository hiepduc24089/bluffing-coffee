<?php

namespace App\DTOs;

readonly class GameFormatLevelDTO
{
    public function __construct(
        public int $position,
        public ?int $levelNumber,
        public int $smallBlind,
        public int $bigBlind,
        public int $ante,
        public int $durationMinutes,
        public bool $isBreak,
        public ?string $note,
    ) {
    }

    /**
     * @param array{levelNumber?: int|null, smallBlind?: int|null, bigBlind?: int|null, ante?: int|null, durationMinutes: int, isBreak?: bool, note?: string|null} $payload
     */
    public static function fromArray(array $payload, int $position): self
    {
        $isBreak = (bool) ($payload['isBreak'] ?? false);

        return new self(
            position: $position,
            levelNumber: $isBreak ? null : (isset($payload['levelNumber']) ? (int) $payload['levelNumber'] : null),
            smallBlind: $isBreak ? 0 : (int) ($payload['smallBlind'] ?? 0),
            bigBlind: $isBreak ? 0 : (int) ($payload['bigBlind'] ?? 0),
            ante: $isBreak ? 0 : (int) ($payload['ante'] ?? 0),
            durationMinutes: (int) $payload['durationMinutes'],
            isBreak: $isBreak,
            note: $payload['note'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabasePayload(): array
    {
        return [
            'position' => $this->position,
            'level_number' => $this->levelNumber,
            'small_blind' => $this->smallBlind,
            'big_blind' => $this->bigBlind,
            'ante' => $this->ante,
            'duration_minutes' => $this->durationMinutes,
            'is_break' => $this->isBreak,
            'note' => $this->note,
        ];
    }
}
