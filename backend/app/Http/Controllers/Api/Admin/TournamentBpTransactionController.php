<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBpTransactionRequest;
use App\Http\Resources\BpTransactionResource;
use App\Models\BpTransaction;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use App\Services\BpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TournamentBpTransactionController extends Controller
{
    public function __construct(
        private readonly BpService $bpService,
    ) {
    }

    public function index(Tournament $tournament): AnonymousResourceCollection
    {
        $transactions = BpTransaction::query()
            ->with(['user', 'reference.user'])
            ->where('reference_type', (new TournamentRegistration())->getMorphClass())
            ->whereHasMorph('reference', [TournamentRegistration::class], function ($query) use ($tournament) {
                $query->where('tournament_id', $tournament->id);
            })
            ->latest('created_at')
            ->get();

        return BpTransactionResource::collection($transactions);
    }

    public function update(UpdateBpTransactionRequest $request, BpTransaction $transaction): BpTransactionResource
    {
        $validated = $request->validated();

        $transaction = $this->bpService->updateTransaction(
            transaction: $transaction,
            amount: (int) $validated['amount'],
            note: $validated['note'] ?? null,
        );

        return BpTransactionResource::make($transaction->load(['user', 'reference.user']));
    }

    public function destroy(BpTransaction $transaction): JsonResponse
    {
        $this->bpService->deleteTransaction($transaction);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
