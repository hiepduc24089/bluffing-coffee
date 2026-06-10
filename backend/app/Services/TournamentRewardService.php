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
                    'rewardProfileId' => 'Tournament must have a reward profile before finalizing rewards.',
                ]);
            }

            $rewardByPosition = $lockedTournament->rewardProfile->items
                ->keyBy('position');

            $transactions = [];

            foreach ($lockedTournament->registrations as $registration) {
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
}
