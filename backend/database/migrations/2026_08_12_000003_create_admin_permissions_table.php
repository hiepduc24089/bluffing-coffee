<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phân quyền nhân viên: gán trực tiếp cho từng tài khoản admin, không qua vai trò.
 *
 * Quán chỉ có vài nhân viên nên một lớp vai trò trung gian chỉ làm rối; ma trận
 * module × action gán thẳng cho từng người là đủ và dễ nhìn hơn khi vận hành.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('password')->index();
        });

        Schema::create('admin_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained()->cascadeOnDelete();
            $table->string('permission')->index();
            $table->timestamps();

            $table->unique(['admin_id', 'permission']);
        });

        // Tài khoản admin đang tồn tại là chủ quán, giữ nguyên toàn quyền.
        DB::table('admins')->update(['is_super_admin' => true]);
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_permissions');

        Schema::table('admins', function (Blueprint $table) {
            $table->dropIndex(['is_super_admin']);
            $table->dropColumn('is_super_admin');
        });
    }
};
