<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Bỏ mọi công tắc bật/tắt do người dùng chọn tay.
 *
 * Quán không có quy trình duyệt: tạo ra cái gì là dùng ngay cái đó. Giải đấu vì
 * vậy không còn cột `status`; trạng thái hiển thị được suy ra từ `start_at` và
 * `finalized_at` (xem App\Enums\TournamentPhaseEnum). `finalized_at` giữ lại vì
 * nó là thứ duy nhất chặn chốt thưởng hai lần.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->timestamp('finalized_at')->nullable()->after('capacity')->index();
        });

        // Giải đã hoàn tất trước đây coi như đã chốt thưởng tại thời điểm bắt đầu,
        // để không bị chốt thưởng lại lần nữa sau khi bỏ cột status.
        DB::table('tournaments')
            ->where('status', 'completed')
            ->update(['finalized_at' => DB::raw('start_at')]);

        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });

        Schema::table('banners', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropColumn('is_active');
        });

        Schema::table('content_pages', function (Blueprint $table) {
            $table->dropIndex(['is_published']);
            $table->dropColumn('is_published');
        });
    }

    public function down(): void
    {
        Schema::table('content_pages', function (Blueprint $table) {
            $table->boolean('is_published')->default(true)->after('content')->index();
        });

        Schema::table('banners', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('sort_order')->index();
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'running', 'completed'])
                ->default('published')
                ->after('capacity')
                ->index();
        });

        DB::table('tournaments')
            ->whereNotNull('finalized_at')
            ->update(['status' => 'completed']);

        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropIndex(['finalized_at']);
            $table->dropColumn('finalized_at');
        });
    }
};
