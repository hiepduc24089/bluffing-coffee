<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bỏ giới hạn số lần rebuy.
 *
 * Quán không giới hạn rebuy, nên cột này là cấu hình không ai dùng. Giữ lại một
 * ô nhập mà mọi người luôn để trống chỉ tạo thêm chỗ để bấm nhầm — bấm nhầm ở
 * đây nghĩa là khách ra quầy trả tiền xong mà hệ thống từ chối cho ngồi lại.
 *
 * Rebuy vẫn được ghi nhận đầy đủ trong `tournament_purchases`; chỉ luật chặn
 * biến mất, không phải bản thân rebuy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tournament_templates', function (Blueprint $table) {
            $table->dropColumn('max_rebuy');
        });
    }

    public function down(): void
    {
        Schema::table('tournament_templates', function (Blueprint $table) {
            $table->unsignedSmallInteger('max_rebuy')->nullable()->after('late_reg_until_level');
        });
    }
};
