<?php

namespace Database\Seeders;

use App\Models\RewardProfile;
use Illuminate\Database\Seeder;

class RewardProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            'DEFAULT_SNG' => ['name' => 'Default Sit & Go', 'items' => [1 => 150, 2 => 90, 3 => 50]],
            'DEFAULT_TURBO' => ['name' => 'Default Turbo', 'items' => [1 => 180, 2 => 110, 3 => 60]],
            'DEFAULT_DEEPSTACK' => ['name' => 'Default DeepStack', 'items' => [1 => 250, 2 => 150, 3 => 90]],
            'ANNIVERSARY' => ['name' => 'Anniversary Event', 'items' => [1 => 1000, 2 => 600, 3 => 300]],
            'NEW_YEAR' => ['name' => 'New Year Event', 'items' => [1 => 700, 2 => 400, 3 => 200]],
        ];

        foreach ($profiles as $code => $payload) {
            $profile = RewardProfile::query()->firstOrCreate(
                ['code' => $code],
                [
                    'name' => $payload['name'],
                    'is_active' => true,
                ],
            );

            foreach ($payload['items'] as $position => $bpReward) {
                $profile->items()->updateOrCreate(
                    ['position' => $position],
                    ['bp_reward' => $bpReward],
                );
            }
        }
    }
}
