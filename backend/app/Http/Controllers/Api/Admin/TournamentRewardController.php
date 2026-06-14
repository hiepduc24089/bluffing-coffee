<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BpTransactionResource;
use App\Models\Tournament;
use App\Services\TournamentRewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TournamentRewardController extends Controller
{
    public function __construct(
        private readonly TournamentRewardService $tournamentRewardService,
    ) {
    }

    public function finalize(Tournament $tournament): AnonymousResourceCollection
    {
        $transactions = $this->tournamentRewardService->finalize(
            tournament: $tournament,
            adminId: auth()->id(),
        );

        return BpTransactionResource::collection(collect($transactions));
    }

    public function preview(Tournament $tournament): JsonResponse
    {
        return response()->json([
            'data' => $this->tournamentRewardService->preview($tournament),
        ]);
    }
}
