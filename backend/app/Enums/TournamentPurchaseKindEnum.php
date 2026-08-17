<?php

namespace App\Enums;

/**
 * Loại tiền người chơi bỏ ra trong một giải.
 *
 * Chưa có `AddOn` vì mẫu giải đấu chưa có cấu hình add-on nào — thêm case ở đây
 * mà không có chỗ nào tạo ra nó chỉ tạo ảo giác là tính năng đã tồn tại.
 */
enum TournamentPurchaseKindEnum: string
{
    /** Tiền vào giải. Mỗi lượt đăng ký có đúng một dòng loại này. */
    case Entry = 'entry';

    /** Mua lại chip sau khi cháy. Cộng dồn, không giới hạn số lần. */
    case Rebuy = 'rebuy';

    public function label(): string
    {
        return match ($this) {
            self::Entry => 'Vào giải',
            self::Rebuy => 'Rebuy',
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
