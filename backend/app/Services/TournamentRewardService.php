<?php

namespace App\Services;

use App\Enums\TournamentRegistrationStatusEnum;
use App\Enums\TournamentStatusEnum;
use App\Models\BpTransaction;
use App\Models\Tournament;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TournamentRewardService
{
    public function __construct(
        private readonly BpService $bpService,
        private readonly UserStatisticService $userStatisticService,
        private readonly BadgeService $badgeService,
    ) {
    }

    /**
     * @return array<int, BpTransaction>
     */
    public function finalize(Tournament $tournament, ?int $adminId = null): array
    {
        return DB::transaction(function () use ($tournament, $adminId) {
            $lockedTournament = Tournament::query()
                ->with(['rewardProfile.items', 'registrations.user'])
                ->whereKey($tournament->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if (! $lockedTournament->rewardProfile) {
                throw ValidationException::withMessages([
                    'rewardProfileId' => 'Giải đấu phải có cấu hình thưởng trước khi finalize.',
                ]);
            }

            $rewardByPosition = $lockedTournament->rewardProfile->items
                ->keyBy('position');

            $transactions = [];

            foreach ($lockedTournament->registrations as $registration) {
                if ($registration->status === TournamentRegistrationStatusEnum::Cancelled) {
                    continue;
                }

                if ($registration->final_position === null) {
                    continue;
                }

                $rewardItem = $rewardByPosition->get($registration->final_position);

                if (! $rewardItem || $rewardItem->bp_reward <= 0) {
                    continue;
                }

                $rewardKey = sprintf(
                    'TOURNAMENT:%s:POSITION:%s:USER:%s',
                    $lockedTournament->id,
                    $registration->final_position,
                    $registration->user_id,
                );

                $alreadyRewarded = BpTransaction::query()
                    ->where('reward_key', $rewardKey)
                    ->exists();

                $transaction = $this->bpService->earn(
                    user: $registration->user,
                    amount: $rewardItem->bp_reward,
                    reference: $registration,
                    rewardKey: $rewardKey,
                    note: "Tournament reward for position {$registration->final_position}",
                    createdBy: $adminId,
                );

                $transactions[] = $transaction;

                if (! $alreadyRewarded) {
                    $registration->update([
                        'status' => TournamentRegistrationStatusEnum::Finished->value,
                        'finished_at' => now(),
                    ]);

                    $this->userStatisticService->recordTournamentResult($registration->refresh(), $rewardItem->bp_reward);
                    $this->badgeService->awardForStatistics(
                        $registration->user,
                        $registration->user->statistic()->firstOrCreate(['user_id' => $registration->user_id]),
                    );
                }
            }

            $lockedTournament->update([
                'status' => TournamentStatusEnum::Completed->value,
            ]);

            return $transactions;
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function preview(Tournament $tournament): array
    {
        $tournament->load(['rewardProfile.items', 'registrations.user']);

        if (! $tournament->rewardProfile) {
            throw ValidationException::withMessages([
                'rewardProfileId' => 'Giải đấu phải có cấu hình thưởng trước khi finalize.',
            ]);
        }

        $rewardByPosition = $tournament->rewardProfile->items->keyBy('position');

        return $tournament->registrations
            ->map(function ($registration) use ($tournament, $rewardByPosition) {
                $rewardItem = $registration->final_position !== null
                    ? $rewardByPosition->get($registration->final_position)
                    : null;

                $rewardKey = $registration->final_position !== null
                    ? sprintf(
                        'TOURNAMENT:%s:POSITION:%s:USER:%s',
                        $tournament->id,
                        $registration->final_position,
                        $registration->user_id,
                    )
                    : null;

                $alreadyRewarded = $rewardKey
                    ? BpTransaction::query()->where('reward_key', $rewardKey)->exists()
                    : false;

                $bpReward = (int) ($rewardItem?->bp_reward ?? 0);
                $isCancelled = $registration->status === TournamentRegistrationStatusEnum::Cancelled;
                $isRewardable = ! $isCancelled && $registration->final_position !== null && $bpReward > 0;

                return [
                    'registrationId' => $registration->id,
                    'userId' => $registration->user_id,
                    'userName' => $registration->user?->name,
                    'phone' => $registration->user?->phone,
                    'status' => $registration->status->value,
                    'finalPosition' => $registration->final_position,
                    'bpReward' => $bpReward,
                    'alreadyRewarded' => $alreadyRewarded,
                    'willReward' => $isRewardable && ! $alreadyRewarded,
                    'note' => match (true) {
                        $isCancelled => 'Đăng ký đã bị hủy.',
                        $registration->final_position === null => 'Chưa nhập vị trí kết thúc.',
                        $bpReward <= 0 => 'Chưa cấu hình BP thưởng cho vị trí này.',
                        $alreadyRewarded => 'Đã cộng BP trước đó.',
                        default => null,
                    },
                ];
            })
            ->values()
            ->all();
    }
}
