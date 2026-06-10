<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdjustBpRequest;
use App\Http\Resources\BpTransactionResource;
use App\Models\BpTransaction;
use App\Models\User;
use App\Services\BpService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BpTransactionController extends Controller
{
    public function __construct(
        private readonly BpService $bpService,
    ) {
    }

    public function index(User $user): AnonymousResourceCollection
    {
        $transactions = BpTransaction::query()
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->paginate(20);

        return BpTransactionResource::collection($transactions);
    }

    public function adjust(AdjustBpRequest $request, User $user): BpTransactionResource
    {
        $validated = $request->validated();

        $transaction = $this->bpService->adjust(
            user: $user,
            amount: (int) $validated['amount'],
            note: $validated['note'],
            createdBy: auth()->id(),
        );

        return BpTransactionResource::make($transaction);
    }
}
