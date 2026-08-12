<?php

namespace App\Http\Resources;

use App\Enums\TournamentPhaseEnum;
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
            'tournamentType' => $this->tournament_type?->value ?? 'normal',
            'tournamentTemplateId' => $this->tournament_template_id,
            'tournamentTemplate' => $this->whenLoaded(
                'tournamentTemplate',
                fn () => TournamentTemplateResource::make($this->tournamentTemplate),
            ),
            'buyIn' => $this->buy_in,
            'ticketPriceWithDrink' => $this->ticket_price_with_drink,
            'ticketPriceWithoutDrink' => $this->ticket_price_without_drink,
            'capacity' => $this->capacity,
            'phase' => TournamentPhaseEnum::for($this->resource)->value,
            'finalizedAt' => $this->finalized_at?->format('Y-m-d H:i'),
            'startAt' => $this->start_at?->format('Y-m-d H:i'),
        ];
    }
}
