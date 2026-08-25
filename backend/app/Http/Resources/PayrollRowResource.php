<?php

namespace App\Http\Resources;

use App\DTOs\PayrollRowDTO;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PayrollRowDTO
 */
class PayrollRowResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'staff' => SchedulableStaffResource::make($this->staff),
            'shiftCount' => $this->shiftCount,
            'fullShiftCount' => $this->fullShiftCount,
            'halfShiftCount' => $this->halfShiftCount,
            'totalHours' => $this->totalHours,
            'hourlyRate' => $this->hourlyRate,
            'totalPay' => $this->totalPay,
            'shifts' => $this->shifts,
            'isPaid' => $this->isPaid(),
            'isPayable' => $this->isPayable(),
            'payment' => $this->payment === null ? null : [
                'paidAt' => $this->payment->paid_at->format('Y-m-d H:i'),
                'totalHours' => (float) $this->payment->total_hours,
                'hourlyRate' => $this->payment->hourly_rate,
                'totalPay' => $this->payment->total_pay,
            ],
        ];
    }
}
