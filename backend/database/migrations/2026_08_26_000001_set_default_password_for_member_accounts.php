<?php

use App\Support\PhoneNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Mở khoá những tài khoản kéo từ POS365 về đang không đăng nhập được.
 *
 * Bản thiết kế cũ để `password` null và hẹn người chơi "nhận" tài khoản bằng số
 * điện thoại + OTP. Luồng nhận đó chưa từng được xây, nên mọi thành viên sync
 * về đều nằm trong ngõ cụt: có tên, có BP, có lịch sử giải, mà không có mật
 * khẩu nào nhập đúng được.
 *
 * Cấp cho họ mật khẩu mặc định là chính số điện thoại — đúng quy ước đang dùng
 * cho thành viên do admin tạo tay và cho nút reset mật khẩu.
 *
 * `claimed_at` cố ý giữ nguyên null: người chơi đăng nhập được rồi nhưng chưa
 * từng đăng nhập. Chừng nào chưa, POS365 vẫn làm chủ hồ sơ của họ.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('password')
            ->select('id', 'phone')
            ->orderBy('id')
            ->chunkById(500, function ($users) {
                foreach ($users as $user) {
                    // Số trong `users.phone` lẽ ra đã là dạng nội địa chuẩn hoá,
                    // nhưng bản ghi cũ có thể mang nguyên chuỗi thu ngân gõ.
                    // Băm dạng đã chuẩn hoá để mật khẩu khớp với thứ người chơi
                    // gõ; chuỗi không nhận dạng được thì giữ nguyên văn.
                    $password = PhoneNumber::toLocal($user->phone) ?? $user->phone;

                    if ($password === null || $password === '') {
                        continue;
                    }

                    DB::table('users')->where('id', $user->id)->update([
                        'password' => Hash::make($password),
                        'updated_at' => now(),
                    ]);
                }
            });
    }

    public function down(): void
    {
        // Không đảo ngược được: sau khi chạy `up()` thì tài khoản vỏ và thành
        // viên thật trông giống hệt nhau, không còn dấu hiệu nào để biết mật
        // khẩu nào do migration này đặt. Xoá bừa về null sẽ khoá luôn cả những
        // người chơi đã đăng nhập và đổi mật khẩu trong thời gian đó.
    }
};
