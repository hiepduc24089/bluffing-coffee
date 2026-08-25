<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lương theo giờ (VND) của từng nhân viên, dùng để tính bảng lương hàng tháng
 * từ số giờ đã xếp ca. Để trống nghĩa là chưa chốt lương.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->unsignedInteger('hourly_rate')->nullable()->after('employment_type');
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn('hourly_rate');
        });
    }
};
