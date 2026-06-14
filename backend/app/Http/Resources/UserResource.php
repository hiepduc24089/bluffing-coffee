<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'bpBalance' => $this->bp_balance,
            'rankLevel' => $this->rank_level,
            'statistic' => $this->whenLoaded('statistic', fn () => UserStatisticResource::make($this->statistic)),
            'badges' => BadgeResource::collection($this->whenLoaded('badges')),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
