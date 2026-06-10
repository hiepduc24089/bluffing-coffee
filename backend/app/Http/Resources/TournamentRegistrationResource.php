<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentRegistrationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tournamentId' => $this->tournament_id,
            'userId' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => UserResource::make($this->user)),
            'status' => $this->status->value,
            'finalPosition' => $this->final_position,
            'finishedAt' => $this->finished_at?->format('Y-m-d H:i'),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
