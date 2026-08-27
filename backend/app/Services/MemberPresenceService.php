<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Ghi lại "lần gần nhất thành viên này có mặt ở quán".
 *
 * Không có tín hiệu nào một mình là đủ, nên gom cả ba và luôn lấy cái muộn
 * nhất:
 *
 * 1. POS365 đẩy bản ghi khách đó về trong một lượt sync gia tăng — nghĩa là
 *    quầy vừa động vào khách này. Tín hiệu nhanh nhất (trễ tối đa 60 giây)
 *    nhưng phụ thuộc vào việc POS365 có bump `ModifiedDate` khi bán hàng hay
 *    không, điều CHƯA kiểm chứng được (lần thử 13/08/2026 chạy trên shop
 *    trống, không có đơn nào). Nếu nó không bump thì nhánh này chỉ bắt được
 *    lúc tạo khách và lúc sửa hồ sơ.
 * 2. Nhân viên đăng ký người đó vào một giải — chắc chắn người thật đang đứng
 *    ở quán. Chậm hơn nhưng không dựa vào giả định nào.
 * 3. Người chơi tự đăng nhập vào app.
 *
 * Cột này chỉ dùng để xếp thứ tự gợi ý, không dùng để tính tiền hay tính BP,
 * nên sai lệch vài phút không gây hậu quả gì.
 */
class MemberPresenceService
{
    public function markSeen(User $user, ?CarbonInterface $at = null): void
    {
        $this->markSeenById($user->getKey(), $at);
    }

    public function markSeenById(int $userId, ?CarbonInterface $at = null): void
    {
        $at = $at ?? now();

        // Chỉ tiến, không lùi: một lượt sync toàn bộ hay một bản ghi đến muộn
        // không được kéo mốc của người đang ngồi ở quán về quá khứ.
        //
        // Cập nhật thẳng bằng query builder chứ không qua model: cột này bị ghi
        // liên tục, để nó đụng vào `updated_at` thì `updated_at` không còn nói
        // được điều gì về việc hồ sơ có bị sửa hay không.
        DB::table('users')
            ->where('id', $userId)
            ->where(function ($query) use ($at) {
                $query->whereNull('last_seen_at')
                    ->orWhere('last_seen_at', '<', $at);
            })
            ->update(['last_seen_at' => $at]);
    }
}
