<?php

use App\Support\PhoneNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Mở đường cho tài khoản vỏ kéo từ POS365 về.
 *
 * Hội viên được tạo ở quầy trên POS365 chứ không đăng ký bên Bluffing, nên khi
 * kéo về ta có tên và số điện thoại nhưng KHÔNG có mật khẩu. Người chơi nhận
 * tài khoản sau bằng số điện thoại + OTP, lúc đó `claimed_at` mới được điền.
 *
 * `phone_e164` là bản chuẩn hoá của `phone` dùng riêng cho việc so khớp: số
 * nhập ở quầy và số thành viên tự khai không bao giờ cùng định dạng.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
            $table->string('phone_e164')->nullable()->after('phone')->index();
            $table->timestamp('claimed_at')->nullable()->after('remember_token');
        });

        // Thành viên đang có đều tự đăng nhập được, tức là đã "nhận" tài khoản.
        DB::table('users')->whereNotNull('password')->update([
            'claimed_at' => DB::raw('created_at'),
        ]);

        DB::table('users')
            ->select('id', 'phone')
            ->orderBy('id')
            ->chunkById(500, function ($users) {
                foreach ($users as $user) {
                    $normalized = PhoneNumber::normalize($user->phone);

                    if ($normalized === null) {
                        continue;
                    }

                    DB::table('users')->where('id', $user->id)->update(['phone_e164' => $normalized]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['phone_e164']);
            $table->dropColumn(['phone_e164', 'claimed_at']);
        });

        // Không thể đảo ngược an toàn: tài khoản vỏ chưa có mật khẩu sẽ chặn
        // việc đặt lại cột thành NOT NULL. Xoá chúng trước rồi mới siết cột.
        DB::table('users')->whereNull('password')->delete();

        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};
