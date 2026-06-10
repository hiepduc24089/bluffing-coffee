<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRewardProfileRequest;
use App\Http\Requests\UpdateRewardProfileRequest;
use App\Http\Resources\RewardProfileResource;
use App\Models\RewardProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RewardProfileController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $profiles = RewardProfile::query()
            ->with('items')
            ->orderBy('name')
            ->get();

        return RewardProfileResource::collection($profiles);
    }

    public function store(StoreRewardProfileRequest $request): RewardProfileResource
    {
        $profile = DB::transaction(function () use ($request) {
            $validated = $request->validated();

            $profile = RewardProfile::query()->create([
                'name' => $validated['name'],
                'code' => $validated['code'],
                'is_active' => $validated['isActive'] ?? true,
            ]);

            $this->syncItems($profile, $validated['items']);

            return $profile->load('items');
        });

        return RewardProfileResource::make($profile);
    }

    public function show(RewardProfile $rewardProfile): RewardProfileResource
    {
        return RewardProfileResource::make($rewardProfile->load('items'));
    }

    public function update(UpdateRewardProfileRequest $request, RewardProfile $rewardProfile): RewardProfileResource
    {
        $profile = DB::transaction(function () use ($request, $rewardProfile) {
            $validated = $request->validated();

            $rewardProfile->update([
                'name' => $validated['name'],
                'code' => $validated['code'],
                'is_active' => $validated['isActive'] ?? $rewardProfile->is_active,
            ]);

            $rewardProfile->items()->delete();
            $this->syncItems($rewardProfile, $validated['items']);

            return $rewardProfile->refresh()->load('items');
        });

        return RewardProfileResource::make($profile);
    }

    public function destroy(RewardProfile $rewardProfile): JsonResponse
    {
        $rewardProfile->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @param array<int, array{position: int, bpReward: int}> $items
     */
    private function syncItems(RewardProfile $profile, array $items): void
    {
        foreach ($items as $item) {
            $profile->items()->create([
                'position' => $item['position'],
                'bp_reward' => $item['bpReward'],
            ]);
        }
    }
}
