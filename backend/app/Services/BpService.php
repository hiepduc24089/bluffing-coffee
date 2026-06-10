<?php

namespace App\Services;

use App\Enums\BpTransactionTypeEnum;
use App\Models\BpTransaction;
use App\Models\User;
use App\Models\UserStatistic;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BpService
{
    public function earn(
        User $user,
        int $amount,
        ?Model $reference = null,
        ?string $rewardKey = null,
        ?CarbonInterface $expiresAt = null,
        ?string $note = null,
        ?int $createdBy = null,
    ): BpTransaction {
        return $this->record(
            user: $user,
            amount: $amount,
            type: BpTransactionTypeEnum::Earned,
            reference: $reference,
            rewardKey: $rewardKey,
            expiresAt: $expiresAt,
            note: $note,
            createdBy: $createdBy,
        );
    }

    public function adjust(
        User $user,
        int $amount,
        ?Model $reference = null,
        ?string $note = null,
        ?int $createdBy = null,
    ): BpTransaction {
        return $this->record(
            user: $user,
            amount: $amount,
            type: BpTransactionTypeEnum::Adjusted,
            reference: $reference,
            note: $note,
            createdBy: $createdBy,
        );
    }

    public function reverse(
        User $user,
        int $amount,
        ?Model $reference = null,
        ?string $rewardKey = null,
        ?string $note = null,
        ?int $createdBy = null,
    ): BpTransaction {
        return $this->record(
            user: $user,
            amount: -abs($amount),
            type: BpTransactionTypeEnum::Reversed,
            reference: $reference,
            rewardKey: $rewardKey,
            note: $note,
            createdBy: $createdBy,
        );
    }

    public function updateTransaction(BpTransaction $transaction, int $amount, ?string $note = null): BpTransaction
    {
        if ($amount === 0) {
            throw ValidationException::withMessages([
                'amount' => 'BP amount must not be zero.',
            ]);
        }

        return DB::transaction(function () use ($transaction, $amount, $note) {
            $lockedTransaction = BpTransaction::query()
                ->whereKey($transaction->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $lockedUser = User::query()
                ->whereKey($lockedTransaction->user_id)
                ->lockForUpdate()
                ->firstOrFail();

            $delta = $amount - $lockedTransaction->amount;
            $nextBalance = $lockedUser->bp_balance + $delta;

            if ($nextBalance < 0) {
                throw ValidationException::withMessages([
                    'amount' => 'BP balance cannot be negative.',
                ]);
            }

            $lockedTransaction->update([
                'amount' => $amount,
                'note' => $note ?? $lockedTransaction->note,
            ]);

            if ($lockedTransaction->transaction_type === BpTransactionTypeEnum::Earned) {
                $this->adjustTotalBpEarned($lockedUser->id, $delta);
            }

            $lockedUser->forceFill([
                'bp_balance' => $nextBalance,
            ])->save();

            return $lockedTransaction->refresh();
        });
    }

    public function deleteTransaction(BpTransaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $lockedTransaction = BpTransaction::query()
                ->whereKey($transaction->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $lockedUser = User::query()
                ->whereKey($lockedTransaction->user_id)
                ->lockForUpdate()
                ->firstOrFail();

            $nextBalance = $lockedUser->bp_balance - $lockedTransaction->amount;

            if ($nextBalance < 0) {
                throw ValidationException::withMessages([
                    'amount' => 'BP balance cannot be negative.',
                ]);
            }

            $lockedTransaction->delete();

            if ($lockedTransaction->transaction_type === BpTransactionTypeEnum::Earned) {
                $this->adjustTotalBpEarned($lockedUser->id, -$lockedTransaction->amount);
            }

            $lockedUser->forceFill([
                'bp_balance' => $nextBalance,
            ])->save();
        });
    }

    private function adjustTotalBpEarned(int $userId, int $delta): void
    {
        $statistic = UserStatistic::query()->firstOrCreate([
            'user_id' => $userId,
        ]);

        $statistic->update([
            'total_bp_earned' => max(0, $statistic->total_bp_earned + $delta),
        ]);
    }

    private function record(
        User $user,
        int $amount,
        BpTransactionTypeEnum $type,
        ?Model $reference = null,
        ?string $rewardKey = null,
        ?CarbonInterface $expiresAt = null,
        ?string $note = null,
        ?int $createdBy = null,
    ): BpTransaction {
        if ($amount === 0) {
            throw ValidationException::withMessages([
                'amount' => 'BP amount must not be zero.',
            ]);
        }

        return DB::transaction(function () use ($user, $amount, $type, $reference, $rewardKey, $expiresAt, $note, $createdBy) {
            if ($rewardKey !== null) {
                $existing = BpTransaction::query()
                    ->where('reward_key', $rewardKey)
                    ->first();

                if ($existing) {
                    return $existing;
                }
            }

            $lockedUser = User::query()
                ->whereKey($user->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $nextBalance = $lockedUser->bp_balance + $amount;

            if ($nextBalance < 0) {
                throw ValidationException::withMessages([
                    'amount' => 'BP balance cannot be negative.',
                ]);
            }

            $transaction = BpTransaction::query()->create([
                'user_id' => $lockedUser->id,
                'amount' => $amount,
                'transaction_type' => $type->value,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'reward_key' => $rewardKey,
                'expires_at' => $expiresAt,
                'note' => $note,
                'created_by' => $createdBy,
            ]);

            $lockedUser->forceFill([
                'bp_balance' => $nextBalance,
            ])->save();

            return $transaction;
        });
    }
}
