<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameFormatLevelResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'position' => $this->position,
            'levelNumber' => $this->level_number,
            'smallBlind' => $this->small_blind,
            'bigBlind' => $this->big_blind,
            'ante' => $this->ante,
            'durationMinutes' => $this->duration_minutes,
            'isBreak' => $this->is_break,
            'note' => $this->note,
        ];
    }
}
