<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RewardProfileResource extends JsonResource
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
            'isActive' => $this->is_active,
            'items' => RewardProfileItemResource::collection($this->whenLoaded('items')),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
