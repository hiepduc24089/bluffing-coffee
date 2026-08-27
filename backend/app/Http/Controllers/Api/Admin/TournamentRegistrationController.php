<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TournamentRegistrationStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTournamentRegistrationRequest;
use App\Http\Requests\UpdateTournamentRegistrationRequest;
use App\Http\Resources\TournamentRegistrationResource;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use App\Services\MemberPresenceService;
use App\Services\TournamentPurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class TournamentRegistrationController extends Controller
{
    public function __construct(
        private readonly TournamentPurchaseService $purchaseService,
        private readonly MemberPresenceService $presence,
    ) {
    }

    public function index(Tournament $tournament): AnonymousResourceCollection
    {
        $registrations = $tournament->registrations()
            ->with(['user', 'purchases'])
            ->orderByRaw('final_position is null')
            ->orderBy('final_position')
            ->latest()
            ->get();

        return TournamentRegistrationResource::collection($registrations);
    }

    public function store(StoreTournamentRegistrationRequest $request, Tournament $tournament): TournamentRegistrationResource
    {
        $validated = $request->validated();

        $entryPrice = $validated['entryType'] === 'with_drink'
            ? $tournament->ticket_price_with_drink
            : $tournament->ticket_price_without_drink;

        $registration = DB::transaction(function () use ($tournament, $request, $validated, $entryPrice) {
            $registration = $tournament->registrations()->firstOrCreate(
                ['user_id' => $request->validated('userId')],
                [
                    'entry_price' => $entryPrice,
                    'entry_type' => $validated['entryType'],
                    'status' => TournamentRegistrationStatusEnum::Registered->value,
                ],
            );

            $this->purchaseService->syncEntry($registration, $request->user()?->id);

            // Nhân viên vừa đăng ký người này vào giải, tức là họ đang đứng ở
            // quán ngay lúc này. Đây là tín hiệu "có mặt" chắc chắn nhất ta có
            // — khác với tín hiệu từ POS365, nó không dựa vào giả định nào.
            $this->presence->markSeenById((int) $registration->user_id);

            return $registration;
        });

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
