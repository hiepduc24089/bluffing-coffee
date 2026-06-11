<?php

namespace Database\Seeders;

use App\Models\RewardProfile;
use Illuminate\Database\Seeder;

class RewardProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            'DEFAULT_SNG' => ['name' => 'Default Sit & Go', 'with_drink' => 85000, 'without_drink' => 60000, 'items' => [1 => 150, 2 => 90, 3 => 50]],
            'DEFAULT_TURBO' => ['name' => 'Default Turbo', 'with_drink' => 85000, 'without_drink' => 60000, 'items' => [1 => 180, 2 => 110, 3 => 60]],
            'DEFAULT_DEEPSTACK' => ['name' => 'Default DeepStack', 'with_drink' => 150000, 'without_drink' => 120000, 'items' => [1 => 250, 2 => 150, 3 => 90]],
            'ANNIVERSARY' => ['name' => 'Anniversary Event', 'with_drink' => 200000, 'without_drink' => 160000, 'items' => [1 => 1000, 2 => 600, 3 => 300]],
            'NEW_YEAR' => ['name' => 'New Year Event', 'with_drink' => 180000, 'without_drink' => 140000, 'items' => [1 => 700, 2 => 400, 3 => 200]],
        ];

        foreach ($profiles as $code => $payload) {
            $profile = RewardProfile::query()->firstOrCreate(
                ['code' => $code],
                [
                    'name' => $payload['name'],
                    'is_active' => true,
                    'default_price_with_drink' => $payload['with_drink'],
                    'default_price_without_drink' => $payload['without_drink'],
                ],
            );

            $profile->update([
                'default_price_with_drink' => $payload['with_drink'],
                'default_price_without_drink' => $payload['without_drink'],
            ]);

            foreach ($payload['items'] as $position => $bpReward) {
                $profile->items()->updateOrCreate(
                    ['position' => $position],
                    ['bp_reward' => $bpReward],
                );
            }
        }
    }
}
