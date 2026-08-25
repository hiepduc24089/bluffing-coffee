<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lịch làm việc. Ca part-time luôn đúng nửa ca (8h/2 và 10h/2) nên chỉ cần lưu
 * giờ mở ca theo loại ngày, còn khung giờ cụ thể suy ra từ slot full/early/late
 * — không phải liệt kê sẵn từng khung giờ trong DB.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_settings', function (Blueprint $table) {
            $table->id();
            $table->string('day_type')->unique();
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedTinyInteger('max_barista');
            $table->unsignedTinyInteger('max_dealer');
            $table->timestamps();
        });

        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained()->cascadeOnDelete();
            $table->date('work_date');
            $table->string('slot');
            $table->string('role');
            $table->string('note')->nullable();
            $table->foreignId('created_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamps();

            // Nới ở 2026_08_19_000007 để một người nhận được cả hai nửa ca trong ngày.
            $table->unique(['admin_id', 'work_date']);
            $table->index(['work_date', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_assignments');
        Schema::dropIfExists('shift_settings');
    }
};
