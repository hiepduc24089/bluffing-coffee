<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentLiveEventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tournamentId' => $this->tournament_id,
            'tableKey' => $this->table_key,
            'tournamentRegistrationId' => $this->tournament_registration_id,
            'userId' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => UserResource::make($this->user)),
            'eventType' => $this->event_type,
            'fromTableKey' => $this->from_table_key,
            'fromSeatNumber' => $this->from_seat_number,
            'toTableKey' => $this->to_table_key,
            'toSeatNumber' => $this->to_seat_number,
            'metadata' => $this->metadata,
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
