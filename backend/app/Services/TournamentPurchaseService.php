<?php

namespace App\Services;

use App\Enums\TournamentPurchaseKindEnum;
use App\Models\TournamentPurchase;
use App\Models\TournamentRegistration;

/**
 * Ghi nhận tiền người chơi bỏ ra trong một giải.
 *
 * Mọi đường tạo đăng ký đều phải đi qua đây, nếu không thì sổ tiền thiếu dòng
 * và khi khớp đơn buy-in từ POS365 về sẽ không tìm được chỗ gắn.
 *
 * Không có giới hạn số lần rebuy: quán không giới hạn, nên ở đây cũng không
 * chặn. Người chơi trả tiền bao nhiêu lần thì ghi bấy nhiêu dòng.
 */
class TournamentPurchaseService
{
    /**
     * Đồng bộ dòng `entry` với `entry_price` / `entry_type` của lượt đăng ký.
     *
     * Dùng `updateOrCreate` chứ không `create`: check-in có thể chạy lại trên
     * một lượt đăng ký cũ đã huỷ (xem `TournamentCheckInController`), và một
     * lượt đăng ký chỉ được có đúng một dòng vào giải.
     */
    public function syncEntry(TournamentRegistration $registration, ?int $adminId = null): TournamentPurchase
    {
        return TournamentPurchase::query()->updateOrCreate(
            [
                'tournament_registration_id' => $registration->getKey(),
                'kind' => TournamentPurchaseKindEnum::Entry,
            ],
            [
                'entry_type' => $registration->entry_type,
                'price' => (int) $registration->entry_price,
                'created_by_admin_id' => $adminId,
            ],
        );
    }

    /**
     * Ghi một lần rebuy. Khác `syncEntry`, mỗi lần gọi là một dòng mới.
     */
    public function recordRebuy(TournamentRegistration $registration, ?int $adminId = null): TournamentPurchase
    {
        return TournamentPurchase::query()->create([
            'tournament_registration_id' => $registration->getKey(),
            'kind' => TournamentPurchaseKindEnum::Rebuy,
            'entry_type' => null,
            'price' => $this->rebuyPrice($registration),
            'created_by_admin_id' => $adminId,
        ]);
    }

    /**
     * Giá rebuy bằng giá vé không nước. Quán bán rebuy đúng bằng giá đó, nên
     * chưa cần một cột giá riêng — khi nào hai giá tách nhau thì mới thêm.
     */
    private function rebuyPrice(TournamentRegistration $registration): int
    {
        return (int) ($registration->tournament?->ticket_price_without_drink ?? 0);
    }
}
