<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClearLiveTableSeatRequest;
use App\Http\Requests\EliminateLiveTableSeatRequest;
use App\Http\Requests\LiveTableTournamentRequest;
use App\Http\Requests\MoveLiveTableSeatRequest;
use App\Http\Requests\RebuyLiveTablePlayerRequest;
use App\Http\Requests\SelectLiveTableTournamentRequest;
use App\Http\Resources\LiveTableSeatResource;
use App\Http\Resources\TournamentLiveEventResource;
use App\Http\Resources\TournamentRegistrationResource;
use App\Http\Resources\TournamentResource;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use App\Services\LiveTableService;
use Illuminate\Http\JsonResponse;

class LiveTableController extends Controller
{
    public function __construct(
        private readonly LiveTableService $liveTableService,
    ) {
    }

    public function todayTournaments(): JsonResponse
    {
        return response()->json([
            'data' => TournamentResource::collection($this->liveTableService->todayTournaments())->resolve(),
        ]);
    }

    public function show(LiveTableTournamentRequest $request, string $tableKey): JsonResponse
    {
        return response()->json([
            'data' => $this->formatState($this->liveTableService->getState($tableKey, $request->tournamentId())),
        ]);
    }

    public function selectTournament(SelectLiveTableTournamentRequest $request, string $tableKey): JsonResponse
    {
        $tournament = Tournament::query()->findOrFail($request->validated('tournamentId'));

        $this->liveTableService->selectTournament(
            tableKey: $tableKey,
            tournament: $tournament,
            adminId: $request->user()?->id,
        );

        return response()->json([
            'data' => $this->formatState($this->liveTableService->getState($tableKey, $tournament->id)),
        ]);
    }

    public function move(MoveLiveTableSeatRequest $request, string $tableKey): JsonResponse
    {
        $tournament = Tournament::query()->findOrFail($request->validated('tournamentId'));
        $registration = TournamentRegistration::query()->findOrFail($request->validated('tournamentRegistrationId'));

        $this->liveTableService->moveRegistration(
            tableKey: $tableKey,
            tournament: $tournament,
            registration: $registration,
            toSeatNumber: (int) $request->validated('toSeatNumber'),
            adminId: $request->user()?->id,
        );

        return response()->json([
            'data' => $this->formatState($this->liveTableService->getState($tableKey, $tournament->id)),
        ]);
    }

    public function clear(ClearLiveTableSeatRequest $request, string $tableKey, int $seatNumber): JsonResponse
    {
        $tournament = Tournament::query()->findOrFail($request->validated('tournamentId'));

        $this->liveTableService->clearSeat(
            tableKey: $tableKey,
            tournament: $tournament,
            seatNumber: $seatNumber,
            adminId: $request->user()?->id,
        );

        return response()->json([
            'data' => $this->formatState($this->liveTableService->getState($tableKey, $tournament->id)),
        ]);
    }

    public function eliminate(EliminateLiveTableSeatRequest $request, string $tableKey, int $seatNumber): JsonResponse
    {
        $tournament = Tournament::query()->findOrFail($request->validated('tournamentId'));

        $this->liveTableService->eliminateSeat(
            tableKey: $tableKey,
            tournament: $tournament,
            seatNumber: $seatNumber,
            note: $request->validated('note'),
            adminId: $request->user()?->id,
        );

        return response()->json([
            'data' => $this->formatState($this->liveTableService->getState($tableKey, $tournament->id)),
        ]);
    }

    public function rebuy(RebuyLiveTablePlayerRequest $request, TournamentRegistration $registration): JsonResponse
    {
        $tournament = Tournament::query()->findOrFail($request->validated('tournamentId'));

        $this->liveTableService->rebuy(
            tournament: $tournament,
            registration: $registration,
            adminId: $request->user()?->id,
        );

        return response()->json(null);
    }

    /**
     * @param array<string, mixed> $state
     * @return array<string, mixed>
     */
    private function formatState(array $state): array
    {
        return [
            'table' => [
                'key' => $state['table']->key,
                'name' => $state['table']->name,
                'currentTournamentId' => $state['table']->current_tournament_id,
            ],
            'tournament' => $state['tournament'] ? TournamentResource::make($state['tournament'])->resolve() : null,
            'seats' => LiveTableSeatResource::collection($state['seats'])->resolve(),
            'availableRegistrations' => TournamentRegistrationResource::collection($state['availableRegistrations'])->resolve(),
            'eliminatedRegistrations' => TournamentRegistrationResource::collection($state['eliminatedRegistrations'])->resolve(),
            'events' => TournamentLiveEventResource::collection($state['events'])->resolve(),
        ];
    }
}
