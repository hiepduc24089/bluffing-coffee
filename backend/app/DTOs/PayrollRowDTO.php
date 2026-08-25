<?php

namespace App\DTOs;

use App\Models\Admin;
use App\Models\PayrollPayment;

/**
 * Một dòng bảng lương tháng: giờ công quy từ các ca đã xếp nhân với lương giờ.
 * Khi đã có `payment`, các con số phía trên chỉ còn để đối chiếu — số thực trả
 * là số đã chụp lại trong lần thanh toán.
 */
readonly class PayrollRowDTO
{
    /**
     * @param  array<int, array{workDate: string, slot: string, slotLabel: string, startAt: string, endAt: string, hours: float}>  $shifts
     */
    public function __construct(
        public Admin $staff,
        public int $shiftCount,
        public int $fullShiftCount,
        public int $halfShiftCount,
        public float $totalHours,
        public ?int $hourlyRate,
        public ?int $totalPay,
        public array $shifts,
        public ?PayrollPayment $payment = null,
    ) {}

    public function isPaid(): bool
    {
        return $this->payment instanceof PayrollPayment;
    }

    /**
     * Chỉ trả được khi đã chốt lương giờ, có ca trong tháng và chưa trả lần nào.
     */
    public function isPayable(): bool
    {
        return ! $this->isPaid() && $this->hourlyRate !== null && $this->shiftCount > 0;
    }
}
