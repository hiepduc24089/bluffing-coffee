<?php

namespace App\Http\Resources;

use App\Enums\TournamentPhaseEnum;
use App\Models\LiveTable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Tournament
 */
class DashboardActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phase' => TournamentPhaseEnum::for($this->resource)->value,
            'startAt' => $this->start_at?->format('Y-m-d H:i'),
            'capacity' => $this->capacity,
            'registeredCount' => (int) ($this->registered_count ?? 0),
            'tables' => $this->whenLoaded(
                'liveTables',
                fn () => $this->liveTables->map(fn (LiveTable $table) => $table->name)->values(),
                [],
            ),
        ];
    }
}
