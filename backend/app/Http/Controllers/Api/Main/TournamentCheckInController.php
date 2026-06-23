<?php

namespace App\Http\Controllers\Api\Main;

use App\Enums\TournamentRegistrationStatusEnum;
use App\Enums\TournamentStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Resources\TournamentRegistrationResource;
use App\Http\Resources\TournamentResource;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TournamentCheckInController extends Controller
{
    public function todayTournaments(): AnonymousResourceCollection
    {
        $tournaments = Tournament::query()
            ->with('rewardProfile')
            ->whereBetween('start_at', [now()->startOfDay(), now()->endOfDay()])
            ->whereIn('status', [
                TournamentStatusEnum::Published->value,
                TournamentStatusEnum::Running->value,
            ])
            ->orderBy('start_at')
            ->get();

        return TournamentResource::collection($tournaments);
    }

    public function current(Request $request): JsonResponse
    {
        $registration = $this->activeTodayRegistrationQuery($request)
            ->with('tournament.rewardProfile')
            ->latest()
            ->first();

        if (! $registration) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => TournamentRegistrationResource::make($registration)->resolve(),
        ]);
    }

    public function store(Request $request): TournamentRegistrationResource
    {
        $validated = $request->validate([
            'tournamentId' => ['required', 'uuid', 'exists:tournaments,id'],
            'entryType' => ['required', 'string', Rule::in(['with_drink', 'without_drink'])],
        ]);

        $tournament = Tournament::query()
            ->whereKey($validated['tournamentId'])
            ->whereBetween('start_at', [now()->startOfDay(), now()->endOfDay()])
            ->whereIn('status', [
                TournamentStatusEnum::Published->value,
                TournamentStatusEnum::Running->value,
            ])
            ->first();

        if (! $tournament) {
            throw ValidationException::withMessages([
                'tournamentId' => 'Giải đấu này không mở check-in hôm nay.',
            ]);
        }

        $registration = DB::transaction(function () use ($request, $tournament, $validated) {
            $currentRegistrations = $this->activeTodayRegistrationQuery($request)
                ->lockForUpdate()
                ->get();

            $currentRegistration = $currentRegistrations
                ->firstWhere('tournament_id', $tournament->id);

            if ($currentRegistration) {
                return $currentRegistration;
            }

            $currentRegistrations
                ->where('tournament_id', '!=', $tournament->id)
                ->each(fn (TournamentRegistration $registration) => $registration->update([
                    'status' => TournamentRegistrationStatusEnum::Cancelled->value,
                ]));

            $entryPrice = $validated['entryType'] === 'with_drink'
                ? $tournament->ticket_price_with_drink
                : $tournament->ticket_price_without_drink;

            return TournamentRegistration::query()->updateOrCreate(
                [
                    'tournament_id' => $tournament->id,
                    'user_id' => $request->user()->id,
                ],
                [
                    'entry_price' => $entryPrice,
                    'entry_type' => $validated['entryType'],
                    'status' => TournamentRegistrationStatusEnum::Registered->value,
                    'final_position' => null,
                    'finished_at' => null,
                ],
            );
        });

        return TournamentRegistrationResource::make(
            $registration->refresh()->load(['tournament.rewardProfile', 'user']),
        );
    }

    private function activeTodayRegistrationQuery(Request $request)
    {
        return TournamentRegistration::query()
            ->where('user_id', $request->user()->id)
            ->where('status', TournamentRegistrationStatusEnum::Registered->value)
            ->whereHas('tournament', function ($query) {
                $query
                    ->whereBetween('start_at', [now()->startOfDay(), now()->endOfDay()])
                    ->whereIn('status', [
                        TournamentStatusEnum::Published->value,
                        TournamentStatusEnum::Running->value,
                    ]);
            });
    }
}
