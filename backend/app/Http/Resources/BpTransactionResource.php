<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BpTransactionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => UserResource::make($this->user)),
            'amount' => $this->amount,
            'transactionType' => $this->transaction_type->value,
            'referenceType' => $this->reference_type,
            'referenceId' => $this->reference_id,
            'reference' => $this->whenLoaded('reference', function () {
                if ($this->reference instanceof \App\Models\TournamentRegistration) {
                    return TournamentRegistrationResource::make($this->reference);
                }

                return null;
            }),
            'rewardKey' => $this->reward_key,
            'expiresAt' => $this->expires_at?->format('Y-m-d H:i'),
            'note' => $this->note,
            'createdBy' => $this->created_by,
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
