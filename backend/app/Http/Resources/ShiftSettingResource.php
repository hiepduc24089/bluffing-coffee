<?php

namespace App\Http\Resources;

use App\Models\ShiftSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ShiftSetting
 */
class ShiftSettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'dayType' => $this->day_type->value,
            'dayTypeLabel' => $this->day_type->label(),
            'startTime' => substr($this->start_time, 0, 5),
            'endTime' => substr($this->end_time, 0, 5),
            'maxBarista' => $this->max_barista,
            'maxDealer' => $this->max_dealer,
        ];
    }
}
