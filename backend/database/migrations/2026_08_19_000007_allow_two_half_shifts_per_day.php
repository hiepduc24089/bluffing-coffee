<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ràng buộc cũ "mỗi người một ca mỗi ngày" chặn luôn trường hợp hợp lệ: một bạn
 * part-time nhận cả nửa ca đầu lẫn nửa ca sau — hai khung giờ rời nhau, cộng lại
 * mới bằng nguyên ca.
 *
 * Unique mới chỉ còn là chốt chặn cuối cho việc xếp trùng y hệt; luật "nguyên ca
 * đụng mọi slot" không diễn đạt được bằng index nên do service kiểm.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Tạo trước rồi mới xoá: MySQL đang mượn index cũ làm chỗ dựa cho khoá ngoại
        // `admin_id`, xoá trước sẽ bị từ chối. Index mới cũng mở đầu bằng `admin_id`
        // nên thay thế được vai trò đó.
        Schema::table('shift_assignments', function (Blueprint $table) {
            $table->unique(['admin_id', 'work_date', 'slot']);
        });

        Schema::table('shift_assignments', function (Blueprint $table) {
            $table->dropUnique('shift_assignments_admin_id_work_date_unique');
        });
    }

    public function down(): void
    {
        Schema::table('shift_assignments', function (Blueprint $table) {
            $table->unique(['admin_id', 'work_date']);
        });

        Schema::table('shift_assignments', function (Blueprint $table) {
            $table->dropUnique('shift_assignments_admin_id_work_date_slot_unique');
        });
    }
};
