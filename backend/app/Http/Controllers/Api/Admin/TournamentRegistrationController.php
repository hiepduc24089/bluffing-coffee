<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TournamentRegistrationStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTournamentRegistrationRequest;
use App\Http\Requests\UpdateTournamentRegistrationRequest;
use App\Http\Resources\TournamentRegistrationResource;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TournamentRegistrationController extends Controller
{
    public function index(Tournament $tournament): AnonymousResourceCollection
    {
        $registrations = $tournament->registrations()
            ->with('user')
            ->orderByRaw('final_position is null')
            ->orderBy('final_position')
            ->latest()
            ->get();

        return TournamentRegistrationResource::collection($registrations);
    }

    public function store(StoreTournamentRegistrationRequest $request, Tournament $tournament): TournamentRegistrationResource
    {
        $registration = $tournament->registrations()->firstOrCreate(
            ['user_id' => $request->validated('userId')],
            ['status' => TournamentRegistrationStatusEnum::Registered->value],
        );

        return TournamentRegistrationResource::make($registration->refresh()->load('user'));
    }

    public function update(UpdateTournamentRegistrationRequest $request, TournamentRegistration $registration): TournamentRegistrationResource
    {
        $validated = $request->validated();

        $registration->update([
            'status' => $validated['status'] ?? $registration->status->value,
            'final_position' => $validated['finalPosition'] ?? $registration->final_position,
            'finished_at' => array_key_exists('finalPosition', $validated) && $validated['finalPosition'] !== null
                ? now()
                : $registration->finished_at,
        ]);

        return TournamentRegistrationResource::make($registration->refresh()->load('user'));
    }

    public function destroy(TournamentRegistration $registration): JsonResponse
    {
        $registration->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
