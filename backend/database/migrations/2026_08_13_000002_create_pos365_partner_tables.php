<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ba bảng cho chiều kéo hội viên từ POS365 về.
 *
 * `user_pos365_partners` là quan hệ MỘT-NHIỀU chứ không phải một cột trên
 * `users`: đã thử trên API thật ngày 13/08/2026, POS365 cho phép tạo hai khách
 * khác nhau cùng một số điện thoại. Thu ngân tìm không ra khách cũ nên tạo mới
 * là chuyện sẽ xảy ra hằng tuần, và cùng một người sẽ có nhiều `Partner.Id`.
 *
 * `pos365_partner_imports` giữ nguyên bản ghi thô POS365 trả về, kể cả bản ghi
 * không dùng được. Đây là chỗ đối chiếu khi có tranh cãi về BP, và là hàng đợi
 * việc tay cho những khách thu ngân quên nhập số điện thoại.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_pos365_partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Khoá ghép giữa hai hệ thống. Do POS365 sinh nên không ai gõ tay,
            // không ai gõ sai. `Code` (KH-0001) chỉ để người đọc cho dễ.
            $table->unsignedBigInteger('pos365_partner_id')->unique();
            $table->string('pos365_code')->nullable()->index();

            // Partner đầu tiên gắn với một người; các partner sau là bản trùng
            // do quầy tạo lại. Đơn của partner nào cũng tính BP cho cùng người.
            $table->boolean('is_primary')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_primary']);
        });

        Schema::create('pos365_partner_imports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pos365_partner_id')->unique();
            $table->string('pos365_code')->nullable();
            $table->string('name')->nullable();
            $table->string('phone')->nullable();
            $table->string('phone_e164')->nullable()->index();
            $table->string('status')->index();

            // Bản ghi thô POS365 trả về, giữ nguyên để đối chiếu về sau.
            $table->json('payload');

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('pos365_sync_states', function (Blueprint $table) {
            $table->id();

            // 'partners' bây giờ, 'orders' khi làm tới phần khớp buy-in.
            $table->string('key')->unique();

            // Con trỏ `LatestSync` do POS365 sinh theo giờ máy chủ của họ. Lưu
            // nguyên chuỗi, không parse: mốc là của bên kia, ta chỉ trả lại y
            // như nhận được nên không có rủi ro lệch đồng hồ hay lệch múi giờ.
            $table->string('cursor')->nullable();

            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos365_sync_states');
        Schema::dropIfExists('pos365_partner_imports');
        Schema::dropIfExists('user_pos365_partners');
    }
};
