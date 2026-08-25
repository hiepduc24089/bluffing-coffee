<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hồ sơ làm việc của nhân viên: vị trí đứng quầy và loại hợp đồng. Để trống
 * nghĩa là tài khoản đó không tham gia xếp ca (chủ quán, tài khoản văn phòng).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->string('position')->nullable()->after('is_super_admin')->index();
            $table->string('employment_type')->nullable()->after('position');
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropIndex(['position']);
            $table->dropColumn(['position', 'employment_type']);
        });
    }
};
