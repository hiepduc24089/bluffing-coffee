<?php

namespace App\Http\Controllers\Api;

use App\DTOs\TournamentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTournamentRequest;
use App\Http\Requests\TournamentIndexRequest;
use App\Http\Requests\UpdateTournamentRequest;
use App\Http\Resources\TournamentResource;
use App\Models\Tournament;
use App\Services\TournamentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TournamentController extends Controller
{
    public function __construct(
        private readonly TournamentService $tournamentService,
    ) {
    }

    public function index(TournamentIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $tournaments = $this->tournamentService->paginate(
            search: $validated['search'] ?? null,
            status: $validated['status'] ?? null,
            perPage: (int) ($validated['per_page'] ?? 10),
        );

        return TournamentResource::collection($tournaments);
    }

    public function store(StoreTournamentRequest $request): TournamentResource
    {
        $tournament = $this->tournamentService->create(
            TournamentDTO::fromArray($request->validated()),
        );

        return TournamentResource::make($tournament);
    }

    public function show(Tournament $tournament): TournamentResource
    {
        return TournamentResource::make($tournament);
    }

    public function update(UpdateTournamentRequest $request, Tournament $tournament): TournamentResource
    {
        $tournament = $this->tournamentService->update(
            $tournament,
            TournamentDTO::fromArray($request->validated()),
        );

        return TournamentResource::make($tournament);
    }

    public function destroy(Tournament $tournament): JsonResponse
    {
        $this->tournamentService->delete($tournament);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
