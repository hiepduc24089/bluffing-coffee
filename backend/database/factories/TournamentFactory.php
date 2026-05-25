<?php

namespace Database\Factories;

use App\Enums\TournamentStatusEnum;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Tournament>
 */
class TournamentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'buy_in' => fake()->numberBetween(0, 1_000_000),
            'capacity' => fake()->numberBetween(9, 120),
            'status' => fake()->randomElement(TournamentStatusEnum::values()),
            'start_at' => fake()->dateTimeBetween('now', '+2 months'),
        ];
    }
}
