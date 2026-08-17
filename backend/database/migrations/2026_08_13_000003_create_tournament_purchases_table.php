<?php

use App\Enums\TournamentPurchaseKindEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sổ tiền của từng lượt đăng ký: mỗi lần người chơi bỏ tiền ra là một dòng.
 *
 * Trước migration này, `tournament_registrations.entry_price` là chỗ duy nhất
 * ghi tiền, và nó chỉ chứa được MỘT con số. Rebuy vì thế không có chỗ nào để
 * ghi — `LiveTableService::rebuy()` chỉ xoá người chơi khỏi bàn rồi ghi một sự
 * kiện, không có đồng nào được ghi nhận. Hệ quả trực tiếp: khi khớp đơn buy-in
 * từ POS365 về, mọi đơn rebuy sẽ không tìm được chỗ để gắn vào.
 *
 * `entry_price` trên `tournament_registrations` được GIỮ NGUYÊN, không drop.
 * Migration chạy trước khi container mới lên (xem docs/deployment.md §7), nên
 * bỏ cột mà code cũ còn đọc là làm chết site trong lúc deploy. Dòng `entry`
 * trong bảng này luôn được đồng bộ với nó.
 *
 * Tên bảng là `tournament_purchases` chứ không phải
 * `tournament_registration_purchases`: tên dài hơn làm khoá ngoại tự sinh vượt
 * giới hạn 64 ký tự của MySQL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournament_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_registration_id')->constrained()->cascadeOnDelete();
            $table->string('kind')->index();

            // Chỉ có nghĩa với `entry`: rebuy không kèm nước.
            $table->string('entry_type')->nullable();

            $table->unsignedInteger('price');

            // Ai bấm. Null với check-in do chính người chơi tự làm trên app.
            $table->foreignId('created_by_admin_id')->nullable()
                ->constrained('admins')->nullOnDelete();

            $table->timestamps();

            // Đếm số lần rebuy của một lượt đăng ký — chạy mỗi lần bấm rebuy.
            $table->index(['tournament_registration_id', 'kind']);
        });

        // Mỗi lượt đăng ký đang có sinh ra đúng một dòng `entry` từ dữ liệu thật
        // đã lưu, không suy đoán gì.
        DB::table('tournament_registrations')
            ->select('id', 'entry_price', 'entry_type', 'created_at', 'updated_at')
            ->orderBy('id')
            ->chunkById(500, function ($registrations) {
                DB::table('tournament_purchases')->insert(
                    collect($registrations)->map(fn ($registration) => [
                        'tournament_registration_id' => $registration->id,
                        'kind' => TournamentPurchaseKindEnum::Entry->value,
                        'entry_type' => $registration->entry_type,
                        'price' => (int) $registration->entry_price,
                        'created_by_admin_id' => null,
                        'created_at' => $registration->created_at,
                        'updated_at' => $registration->updated_at,
                    ])->all(),
                );
            });

        // Rebuy cũ chỉ tồn tại dưới dạng sự kiện, không kèm số tiền. Dựng lại
        // theo giá vé không nước của chính giải đó — đó là giá rebuy thật ở
        // quầy. Đây là TÁI DỰNG chứ không phải số liệu gốc: tiền đã đổi tay
        // thật, chỉ là hệ thống chưa từng ghi lại.
        DB::table('tournament_live_events as e')
            ->join('tournaments as t', 't.id', '=', 'e.tournament_id')
            ->where('e.event_type', 'player_rebuy')
            ->whereNotNull('e.tournament_registration_id')
            ->select(
                'e.tournament_registration_id',
                'e.created_by_admin_id',
                'e.created_at',
                't.ticket_price_without_drink as price',
            )
            ->orderBy('e.id')
            ->get()
            ->chunk(500)
            ->each(function ($events) {
                DB::table('tournament_purchases')->insert(
                    $events->map(fn ($event) => [
                        'tournament_registration_id' => $event->tournament_registration_id,
                        'kind' => TournamentPurchaseKindEnum::Rebuy->value,
                        'entry_type' => null,
                        'price' => (int) $event->price,
                        'created_by_admin_id' => $event->created_by_admin_id,
                        'created_at' => $event->created_at,
                        'updated_at' => $event->created_at,
                    ])->all(),
                );
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_purchases');
    }
};
