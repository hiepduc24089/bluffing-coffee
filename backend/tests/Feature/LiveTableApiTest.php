<?php

namespace Tests\Feature;

use App\Enums\TournamentRegistrationStatusEnum;
use App\Enums\TournamentStatusEnum;
use App\Models\Admin;
use App\Models\LiveTableSeat;
use App\Models\LiveTournamentPlayerState;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LiveTableApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_today_tournaments(): void
    {
        $this->actingAsAdmin();

        Tournament::factory()->create([
            'name' => 'Today Main Event',
            'status' => TournamentStatusEnum::Published,
            'start_at' => now()->setTime(19, 0),
        ]);
        Tournament::factory()->create([
            'name' => 'Tomorrow Event',
            'status' => TournamentStatusEnum::Published,
            'start_at' => now()->addDay()->setTime(19, 0),
        ]);

        $response = $this->getJson('/api/admin/live-tables/tournaments/today');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Today Main Event')
            ->assertJsonCount(1, 'data');
    }

    public function test_it_assigns_and_swaps_live_table_seats(): void
    {
        $this->actingAsAdmin();

        $tournament = $this->createTournament();
        $firstRegistration = $this->createRegistration($tournament, 'First Player');
        $secondRegistration = $this->createRegistration($tournament, 'Second Player');

        $this->postJson('/api/admin/live-tables/green/seats/move', [
            'tournamentId' => $tournament->id,
            'tournamentRegistrationId' => $firstRegistration->id,
            'toSeatNumber' => 1,
        ])->assertOk();

        $this->postJson('/api/admin/live-tables/green/seats/move', [
            'tournamentId' => $tournament->id,
            'tournamentRegistrationId' => $secondRegistration->id,
            'toSeatNumber' => 2,
        ])->assertOk();

        $this->postJson('/api/admin/live-tables/green/seats/move', [
            'tournamentId' => $tournament->id,
            'tournamentRegistrationId' => $firstRegistration->id,
            'toSeatNumber' => 2,
        ])
            ->assertOk()
            ->assertJsonPath('data.seats.0.seatNumber', 1)
            ->assertJsonPath('data.seats.0.registration.id', $secondRegistration->id)
            ->assertJsonPath('data.seats.1.seatNumber', 2)
            ->assertJsonPath('data.seats.1.registration.id', $firstRegistration->id);

        $this->assertDatabaseHas('tournament_live_events', [
            'tournament_id' => $tournament->id,
            'event_type' => 'seat_swapped',
            'tournament_registration_id' => $firstRegistration->id,
        ]);
    }

    public function test_it_replaces_an_occupied_seat_when_dragging_from_player_list(): void
    {
        $this->actingAsAdmin();

        $tournament = $this->createTournament();
        $firstRegistration = $this->createRegistration($tournament, 'First Player');
        $secondRegistration = $this->createRegistration($tournament, 'Second Player');

        LiveTableSeat::query()->create([
            'table_key' => 'green',
            'tournament_id' => $tournament->id,
            'tournament_registration_id' => $firstRegistration->id,
            'seat_number' => 1,
        ]);

        $this->postJson('/api/admin/live-tables/green/seats/move', [
            'tournamentId' => $tournament->id,
            'tournamentRegistrationId' => $secondRegistration->id,
            'toSeatNumber' => 1,
        ])
            ->assertOk()
            ->assertJsonPath('data.seats.0.registration.id', $secondRegistration->id)
            ->assertJsonPath('data.availableRegistrations.0.id', $firstRegistration->id);
    }

    public function test_it_eliminates_and_rebuys_a_player(): void
    {
        $this->actingAsAdmin();

        $tournament = $this->createTournament();
        $registration = $this->createRegistration($tournament, 'Bust Player');

        LiveTableSeat::query()->create([
            'table_key' => 'green',
            'tournament_id' => $tournament->id,
            'tournament_registration_id' => $registration->id,
            'seat_number' => 1,
        ]);

        $this->postJson('/api/admin/live-tables/green/seats/1/eliminate', [
            'tournamentId' => $tournament->id,
        ])
            ->assertOk()
            ->assertJsonCount(0, 'data.seats')
            ->assertJsonPath('data.eliminatedRegistrations.0.id', $registration->id);

        $this->assertDatabaseMissing('live_table_seats', [
            'tournament_registration_id' => $registration->id,
        ]);
        $this->assertDatabaseHas('live_tournament_player_states', [
            'tournament_registration_id' => $registration->id,
            'state' => 'eliminated',
        ]);

        $this->postJson('/api/admin/live-tables/registrations/'.$registration->id.'/rebuy', [
            'tournamentId' => $tournament->id,
        ])->assertOk();

        $this->assertDatabaseMissing('live_tournament_player_states', [
            'tournament_registration_id' => $registration->id,
            'state' => 'eliminated',
        ]);
        $this->assertDatabaseHas('tournament_live_events', [
            'tournament_registration_id' => $registration->id,
            'event_type' => 'player_rebuy',
        ]);
    }

    public function test_it_rejects_assigning_an_eliminated_player_without_rebuy(): void
    {
        $this->actingAsAdmin();

        $tournament = $this->createTournament();
        $registration = $this->createRegistration($tournament, 'Bust Player');

        LiveTournamentPlayerState::query()->create([
            'tournament_id' => $tournament->id,
            'tournament_registration_id' => $registration->id,
            'state' => 'eliminated',
            'state_changed_at' => now(),
        ]);

        $this->postJson('/api/admin/live-tables/green/seats/move', [
            'tournamentId' => $tournament->id,
            'tournamentRegistrationId' => $registration->id,
            'toSeatNumber' => 1,
        ])->assertUnprocessable();
    }

    private function createTournament(): Tournament
    {
        return Tournament::factory()->create([
            'status' => TournamentStatusEnum::Published,
            'start_at' => now()->setTime(19, 0),
        ]);
    }

    private function createRegistration(Tournament $tournament, string $name): TournamentRegistration
    {
        return TournamentRegistration::query()->create([
            'tournament_id' => $tournament->id,
            'user_id' => User::factory()->create(['name' => $name])->id,
            'entry_price' => 0,
            'entry_type' => 'with_drink',
            'status' => TournamentRegistrationStatusEnum::Registered->value,
        ]);
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(Admin::factory()->create(), ['admin']);
    }
}
