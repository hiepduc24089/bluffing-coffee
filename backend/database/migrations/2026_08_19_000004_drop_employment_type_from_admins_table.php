<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Loại hợp đồng không quyết định được ca: một bạn full-time hôm nào bận vẫn có
 * thể nhận nửa ca. Khung ca giờ chọn tự do lúc xếp lịch nên cột này thành thừa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn('employment_type');
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->string('employment_type')->nullable()->after('position');
        });
    }
};
