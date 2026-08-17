<?php

namespace App\Enums;

/**
 * Các loại sự kiện được ghi vào `tournament_live_events`.
 *
 * Giá trị chuỗi giữ nguyên như trước khi có enum: migration
 * `create_tournament_purchases_table` backfill rebuy theo `player_rebuy`, và
 * frontend map nhãn theo đúng các chuỗi này.
 */
enum LiveTableEventTypeEnum: string
{
    case TableSelected = 'table_selected';
    case SeatAssigned = 'seat_assigned';
    case SeatMoved = 'seat_moved';
    case SeatSwapped = 'seat_swapped';
    case SeatCleared = 'seat_cleared';
    case PlayerEliminated = 'player_eliminated';
    case PlayerRebuy = 'player_rebuy';

    /** Gom nhiều bàn của cùng một giải về một bàn để đánh final. */
    case TablesMerged = 'tables_merged';

    public function label(): string
    {
        return match ($this) {
            self::TableSelected => 'Chọn giải đấu',
            self::SeatAssigned => 'Xếp ghế',
            self::SeatMoved => 'Chuyển ghế',
            self::SeatSwapped => 'Đổi ghế',
            self::SeatCleared => 'Bỏ khỏi ghế',
            self::PlayerEliminated => 'Cháy',
            self::PlayerRebuy => 'Re-buy',
            self::TablesMerged => 'Gom bàn',
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
