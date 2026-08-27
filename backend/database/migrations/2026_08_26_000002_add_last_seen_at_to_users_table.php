<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * "Lần gần nhất người này có mặt ở quán".
 *
 * Danh sách thành viên chỉ có tăng: ai đã chơi một lần thì nằm lại đó mãi. Sau
 * vài trăm khách thì ô chọn người chơi lúc đăng ký giải trở thành vô dụng —
 * nhân viên phải bơi qua những người sáu tháng không đến để tìm người đang
 * đứng trước mặt mình. Sắp xếp theo cột này kéo đúng nhóm đó lên đầu.
 *
 * Cột được cập nhật từ ba nguồn, xem `MemberPresenceService`. Không nguồn nào
 * là sự thật đầy đủ, nên lấy mốc muộn nhất trong ba.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->after('claimed_at')->index();
        });

        // Mồi cho dữ liệu đang có. Ngày tạo tài khoản cũng là một lần có mặt
        // thật: hội viên do thu ngân tạo ngay tại quầy lúc bán hàng, không ai
        // tự đăng ký từ xa. Lấy mốc muộn nhất trong ba tín hiệu đang có sẵn.
        DB::table('users')
            ->select('users.id', 'users.created_at', 'users.claimed_at')
            ->selectSub(
                DB::table('tournament_registrations')
                    ->selectRaw('max(created_at)')
                    ->whereColumn('user_id', 'users.id'),
                'last_registered_at',
            )
            ->orderBy('users.id')
            ->chunkById(500, function ($users) {
                foreach ($users as $user) {
                    $candidates = array_filter([
                        $user->created_at,
                        $user->claimed_at,
                        $user->last_registered_at,
                    ]);

                    if ($candidates === []) {
                        continue;
                    }

                    $lastSeen = max(array_map(
                        fn (string $value) => Carbon::parse($value),
                        $candidates,
                    ));

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['last_seen_at' => $lastSeen]);
                }
            }, 'users.id', 'id');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['last_seen_at']);
            $table->dropColumn('last_seen_at');
        });
    }
};
