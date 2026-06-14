<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserStatisticResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'totalBpEarned' => $this->total_bp_earned,
            'tournamentsPlayed' => $this->tournaments_played,
            'championshipsWon' => $this->championships_won,
            'sitngoWins' => $this->sitngo_wins,
            'turboWins' => $this->turbo_wins,
            'deepstackWins' => $this->deepstack_wins,
            'lastPlayedAt' => $this->last_played_at?->format('Y-m-d H:i'),
        ];
    }
}
