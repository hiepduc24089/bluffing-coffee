<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\DTOs\DashboardSummaryDTO
 */
class DashboardSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'stats' => [
                'activeLiveTables' => $this->activeLiveTables,
                'openTournaments' => $this->openTournaments,
                'activeRegistrations' => $this->activeRegistrations,
                'totalMembers' => $this->totalMembers,
            ],
            'recentTournaments' => DashboardActivityResource::collection($this->recentTournaments)->resolve($request),
        ];
    }
}
