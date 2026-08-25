<?php

namespace App\Http\Resources;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Admin
 */
class SchedulableStaffResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'position' => $this->position?->value,
            'positionLabel' => $this->position?->label(),
        ];
    }
}
