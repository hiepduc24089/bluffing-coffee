<?php

namespace App\DTOs;

use App\Enums\ShiftSlotEnum;
use App\Enums\StaffPositionEnum;
use Carbon\CarbonImmutable;

readonly class ShiftAssignmentDTO
{
    public function __construct(
        public int $staffId,
        public CarbonImmutable $workDate,
        public ShiftSlotEnum $slot,
        public ?StaffPositionEnum $role,
        public ?string $note,
    ) {}

    /**
     * @param  array{staffId: int|string, workDate: string, slot: string, role?: string|null, note?: string|null}  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            staffId: (int) $payload['staffId'],
            workDate: CarbonImmutable::parse($payload['workDate'])->startOfDay(),
            slot: ShiftSlotEnum::from($payload['slot']),
            role: isset($payload['role']) ? StaffPositionEnum::from($payload['role']) : null,
            note: $payload['note'] ?? null,
        );
    }
}
