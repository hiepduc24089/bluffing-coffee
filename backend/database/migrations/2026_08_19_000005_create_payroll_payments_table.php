<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mỗi dòng là một lần chuyển khoản lương cho một nhân viên trong một tháng.
 * Giờ công, lương giờ và thành tiền được chụp lại tại thời điểm trả: bảng lương
 * tính động từ lịch, nhưng số đã chuyển thì phải giữ nguyên để đối chiếu sau này.
 *
 * Sự tồn tại của dòng này cũng là khoá của các ca trong tháng đó — đã trả tiền
 * thì không ai sửa lại giờ công được nữa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained()->cascadeOnDelete();
            // Luôn là ngày đầu tháng; dùng kiểu date để so sánh và index như ngày thường.
            $table->date('period_month');
            $table->decimal('total_hours', 8, 2);
            $table->unsignedInteger('hourly_rate');
            $table->unsignedBigInteger('total_pay');
            $table->timestamp('paid_at');
            $table->foreignId('paid_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamps();

            // Một nhân viên chỉ được chốt lương một lần mỗi tháng.
            $table->unique(['admin_id', 'period_month']);
            $table->index('period_month');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_payments');
    }
};
