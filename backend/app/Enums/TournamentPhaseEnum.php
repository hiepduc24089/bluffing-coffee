<?php

namespace App\Enums;

use App\Models\Tournament;
use Illuminate\Database\Eloquent\Builder;

/**
 * Giải đấu không còn cột trạng thái do admin chọn. Giai đoạn của giải luôn suy ra
 * từ dữ liệu thật: giờ bắt đầu và thời điểm chốt thưởng.
 */
enum TournamentPhaseEnum: string
{
    case Upcoming = 'upcoming';
    case Running = 'running';
    case Completed = 'completed';

    public static function for(Tournament $tournament): self
    {
        if ($tournament->finalized_at !== null) {
            return self::Completed;
        }

        if ($tournament->start_at !== null && $tournament->start_at->isFuture()) {
            return self::Upcoming;
        }

        return self::Running;
    }

    /**
     * @param  Builder<Tournament>  $query
     * @return Builder<Tournament>
     */
    public function scope(Builder $query): Builder
    {
        return match ($this) {
            self::Completed => $query->whereNotNull('finalized_at'),
            self::Upcoming => $query->whereNull('finalized_at')->where('start_at', '>', now()),
            self::Running => $query->whereNull('finalized_at')->where('start_at', '<=', now()),
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
