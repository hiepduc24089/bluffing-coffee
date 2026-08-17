<?php

namespace App\Services\Pos365;

use App\Enums\Pos365PartnerImportStatusEnum;

/**
 * Kết quả một lượt đồng bộ, để command và màn admin cùng đọc được.
 */
class Pos365SyncResult
{
    /**
     * @param  array<string, int>  $byStatus
     */
    private function __construct(
        public readonly bool $ran,
        public readonly int $received = 0,
        public readonly int $failed = 0,
        public readonly array $byStatus = [],
        public readonly ?string $cursor = null,
        public readonly ?string $skipReason = null,
    ) {}

    public static function skipped(string $reason): self
    {
        return new self(ran: false, skipReason: $reason);
    }

    /**
     * @param  array<string, int>  $byStatus
     */
    public static function completed(int $received, int $failed, array $byStatus, ?string $cursor): self
    {
        return new self(
            ran: true,
            received: $received,
            failed: $failed,
            byStatus: $byStatus,
            cursor: $cursor,
        );
    }

    public function count(Pos365PartnerImportStatusEnum $status): int
    {
        return $this->byStatus[$status->value] ?? 0;
    }
}
