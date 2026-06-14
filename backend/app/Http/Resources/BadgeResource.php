<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BadgeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'icon' => $this->icon,
            'description' => $this->description,
            'isSystem' => $this->is_system,
            'earnedAt' => $this->whenPivotLoaded('user_badges', fn () => $this->pivot->earned_at),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
