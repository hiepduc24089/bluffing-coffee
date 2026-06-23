<?php

namespace Tests\Feature;

use App\Enums\TournamentStatusEnum;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MainCheckInApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_today_open_tournaments_for_member_check_in(): void
    {
        $this->actingAsMember();

        Tournament::factory()->create([
            'name' => 'Today Open Event',
            'status' => TournamentStatusEnum::Published,
            'start_at' => now()->setTime(19, 0),
        ]);
        Tournament::factory()->create([
            'name' => 'Today Draft Event',
            'status' => TournamentStatusEnum::Draft,
            'start_at' => now()->setTime(20, 0),
        ]);
        Tournament::factory()->create([
            'name' => 'Tomorrow Open Event',
            'status' => TournamentStatusEnum::Published,
            'start_at' => now()->addDay()->setTime(19, 0),
        ]);

        $response = $this->getJson('/api/main/check-in/tournaments/today');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Today Open Event');
    }

    public function test_member_can_check_in_to_today_tournament(): void
    {
        $member = User::factory()->create();
        Sanctum::actingAs($member, ['member']);

        $tournament = Tournament::factory()->create([
            'status' => TournamentStatusEnum::Published,
            'ticket_price_with_drink' => 85000,
            'ticket_price_without_drink' => 60000,
            'start_at' => now()->setTime(19, 0),
        ]);

        $response = $this->postJson('/api/main/check-in', [
            'tournamentId' => $tournament->id,
            'entryType' => 'with_drink',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.tournamentId', $tournament->id)
            ->assertJsonPath('data.userId', $member->id)
            ->assertJsonPath('data.entryPrice', 85000)
            ->assertJsonPath('data.entryType', 'with_drink');

        $this->assertDatabaseHas('tournament_registrations', [
            'tournament_id' => $tournament->id,
            'user_id' => $member->id,
            'entry_price' => 85000,
            'entry_type' => 'with_drink',
            'status' => 'registered',
        ]);
    }

    public function test_member_cannot_check_in_to_tournament_outside_today(): void
    {
        $this->actingAsMember();

        $tournament = Tournament::factory()->create([
            'status' => TournamentStatusEnum::Published,
            'start_at' => now()->addDay()->setTime(19, 0),
        ]);

        $this->postJson('/api/main/check-in', [
            'tournamentId' => $tournament->id,
            'entryType' => 'without_drink',
        ])->assertUnprocessable();
    }

    private function actingAsMember(): void
    {
        Sanctum::actingAs(User::factory()->create(), ['member']);
    }
}
