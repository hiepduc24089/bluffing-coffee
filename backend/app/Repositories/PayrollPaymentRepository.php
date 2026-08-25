<?php

namespace App\Repositories;

use App\Models\Admin;
use App\Models\PayrollPayment;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class PayrollPaymentRepository
{
    /**
     * @return Collection<int, PayrollPayment>
     */
    public function forMonth(CarbonInterface $month): Collection
    {
        return PayrollPayment::query()
            ->where('period_month', $month->startOfMonth()->toDateString())
            ->get();
    }

    public function find(Admin $staff, CarbonInterface $month): ?PayrollPayment
    {
        return PayrollPayment::query()
            ->where('admin_id', $staff->getKey())
            ->where('period_month', $month->startOfMonth()->toDateString())
            ->first();
    }

    /**
     * Khoá dòng để hai admin cùng bấm "thanh toán" không tạo ra hai lần chuyển khoản.
     */
    public function findLocked(Admin $staff, CarbonInterface $month): ?PayrollPayment
    {
        return PayrollPayment::query()
            ->where('admin_id', $staff->getKey())
            ->where('period_month', $month->startOfMonth()->toDateString())
            ->lockForUpdate()
            ->first();
    }

    /**
     * Các cặp `adminId-YYYY-MM` đã trả lương trong khoảng ngày. Lịch chỉ trải một
     * tuần nên tập này rất nhỏ, tra bằng set thay vì truy vấn theo từng ca.
     *
     * @return SupportCollection<int, string>
     */
    public function paidKeysBetween(CarbonInterface $from, CarbonInterface $to): SupportCollection
    {
        return PayrollPayment::query()
            ->whereBetween('period_month', [
                $from->copy()->startOfMonth()->toDateString(),
                $to->copy()->startOfMonth()->toDateString(),
            ])
            ->get(['admin_id', 'period_month'])
            ->map(fn (PayrollPayment $payment) => self::key($payment->admin_id, $payment->period_month))
            ->values();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): PayrollPayment
    {
        return PayrollPayment::query()->create($attributes);
    }

    public function delete(PayrollPayment $payment): void
    {
        $payment->delete();
    }

    public static function key(int $adminId, CarbonInterface $date): string
    {
        return $adminId.'-'.$date->format('Y-m');
    }
}
