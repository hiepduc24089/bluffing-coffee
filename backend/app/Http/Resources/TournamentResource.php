<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'buyIn' => $this->buy_in,
            'ticketPriceWithDrink' => $this->ticket_price_with_drink,
            'ticketPriceWithoutDrink' => $this->ticket_price_without_drink,
            'capacity' => $this->capacity,
            'status' => $this->status->value,
            'rewardProfileId' => $this->reward_profile_id,
            'rewardProfile' => $this->whenLoaded('rewardProfile', fn () => RewardProfileResource::make($this->rewardProfile)),
            'startAt' => $this->start_at?->format('Y-m-d H:i'),
        ];
    }
}
