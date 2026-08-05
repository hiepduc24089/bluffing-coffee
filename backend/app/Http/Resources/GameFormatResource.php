<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameFormatResource extends JsonResource
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
            'tournamentType' => $this->tournament_type->value,
            'startingStack' => $this->starting_stack,
            'lateRegUntilLevel' => $this->late_reg_until_level,
            'maxRebuy' => $this->max_rebuy,
            'rebuyStack' => $this->rebuy_stack,
            'description' => $this->description,
            'isActive' => $this->is_active,
            'levels' => GameFormatLevelResource::collection($this->whenLoaded('levels')),
            'levelCount' => $this->whenLoaded('levels', fn () => $this->levels->where('is_break', false)->count()),
            'breakCount' => $this->whenLoaded('levels', fn () => $this->levels->where('is_break', true)->count()),
            'totalDurationMinutes' => $this->whenLoaded('levels', fn () => (int) $this->levels->sum('duration_minutes')),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
