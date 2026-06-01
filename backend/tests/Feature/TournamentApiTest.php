<?php

namespace Tests\Feature;

use App\Enums\TournamentStatusEnum;
use App\Models\Admin;
use App\Models\Tournament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TournamentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_tournaments_with_pagination(): void
    {
        Tournament::factory()->create([
            'name' => 'Friday Deep Stack',
            'status' => TournamentStatusEnum::Published,
        ]);
        Tournament::factory()->create([
            'name' => 'Sunday Main Event',
            'status' => TournamentStatusEnum::Draft,
        ]);

        $response = $this->getJson('/api/main/tournaments?search=Friday&status=published&per_page=10');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Friday Deep Stack')
            ->assertJsonPath('data.0.status', 'published')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_it_creates_a_tournament(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/tournaments', [
            'name' => 'Friday Deep Stack',
            'buyIn' => 150000,
            'capacity' => 60,
            'status' => 'published',
            'startAt' => '2026-05-16 19:00',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Friday Deep Stack')
            ->assertJsonPath('data.buyIn', 150000)
            ->assertJsonPath('data.startAt', '2026-05-16 19:00');

        $this->assertDatabaseHas('tournaments', [
            'name' => 'Friday Deep Stack',
            'buy_in' => 150000,
            'status' => 'published',
        ]);
    }

    public function test_it_updates_a_tournament(): void
    {
        $this->actingAsAdmin();

        $tournament = Tournament::factory()->create([
            'status' => TournamentStatusEnum::Draft,
        ]);

        $response = $this->putJson('/api/admin/tournaments/'.$tournament->id, [
            'name' => 'Updated Main Event',
            'buyIn' => 500000,
            'capacity' => 120,
            'status' => 'running',
            'startAt' => '2026-05-18 14:00',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Main Event')
            ->assertJsonPath('data.status', 'running');
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(Admin::factory()->create(), ['admin']);
    }
}
