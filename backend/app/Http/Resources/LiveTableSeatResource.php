<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LiveTableSeatResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tableKey' => $this->table_key,
            'tournamentId' => $this->tournament_id,
            'tournamentRegistrationId' => $this->tournament_registration_id,
            'seatNumber' => $this->seat_number,
            'registration' => $this->whenLoaded('registration', fn () => TournamentRegistrationResource::make($this->registration)),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
            'updatedAt' => $this->updated_at?->format('Y-m-d H:i'),
        ];
    }
}
