<?php

namespace App\Services;

use App\Enums\TournamentRegistrationStatusEnum;
use App\Models\LiveTable;
use App\Models\LiveTableSeat;
use App\Models\LiveTournamentPlayerState;
use App\Models\Tournament;
use App\Models\TournamentLiveEvent;
use App\Models\TournamentRegistration;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LiveTableService
{
    public const TABLES = [
        'green' => 'Bàn Xanh Lá',
        'red' => 'Bàn Đỏ',
        'blue' => 'Bàn Xanh Dương',
    ];

    /**
     * @return Collection<int, Tournament>
     */
    public function todayTournaments(): Collection
    {
        return Tournament::query()
            ->whereBetween('start_at', [now()->startOfDay(), now()->endOfDay()])
            ->orderBy('start_at')
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function getState(string $tableKey, ?string $tournamentId = null): array
    {
        $table = $this->ensureTable($tableKey);
        $resolvedTournamentId = $tournamentId ?? $table->current_tournament_id;
        $tournament = $resolvedTournamentId
            ? Tournament::query()->find($resolvedTournamentId)
            : null;

        $seats = collect();
        $availableRegistrations = collect();
        $eliminatedRegistrations = collect();
        $events = collect();

        if ($tournament) {
            $registrations = $tournament->registrations()
                ->with(['user', 'liveSeat', 'liveState'])
                ->where('status', '!=', TournamentRegistrationStatusEnum::Cancelled->value)
                ->latest()
                ->get();

            $seatedRegistrationIds = LiveTableSeat::query()
                ->where('tournament_id', $tournament->id)
                ->pluck('tournament_registration_id')
                ->all();

            $eliminatedRegistrationIds = LiveTournamentPlayerState::query()
                ->where('tournament_id', $tournament->id)
                ->where('state', 'eliminated')
                ->pluck('tournament_registration_id')
                ->all();

            $seats = LiveTableSeat::query()
                ->with('registration.user')
                ->where('tournament_id', $tournament->id)
                ->where('table_key', $tableKey)
                ->orderBy('seat_number')
                ->get();

            $availableRegistrations = $registrations
                ->whereNotIn('id', $seatedRegistrationIds)
                ->whereNotIn('id', $eliminatedRegistrationIds)
                ->values();

            $eliminatedRegistrations = $registrations
                ->whereIn('id', $eliminatedRegistrationIds)
                ->values();

            $events = TournamentLiveEvent::query()
                ->with('user')
                ->where('tournament_id', $tournament->id)
                ->latest()
                ->limit(50)
                ->get();
        }

        return [
            'table' => $table,
            'tournament' => $tournament,
            'seats' => $seats,
            'availableRegistrations' => $availableRegistrations,
            'eliminatedRegistrations' => $eliminatedRegistrations,
            'events' => $events,
        ];
    }

    public function selectTournament(string $tableKey, Tournament $tournament, ?int $adminId = null): LiveTable
    {
        return DB::transaction(function () use ($tableKey, $tournament, $adminId) {
            $table = $this->ensureTable($tableKey);
            $table->update(['current_tournament_id' => $tournament->id]);

            $this->recordEvent(
                tournament: $tournament,
                tableKey: $tableKey,
                eventType: 'table_selected',
                adminId: $adminId,
            );

            return $table->refresh();
        });
    }

    public function moveRegistration(string $tableKey, Tournament $tournament, TournamentRegistration $registration, int $toSeatNumber, ?int $adminId = null): void
    {
        $this->validateTableKey($tableKey);
        $this->validateSeatNumber($toSeatNumber);
        $this->assertRegistrationBelongsToTournament($registration, $tournament);

        DB::transaction(function () use ($tableKey, $tournament, $registration, $toSeatNumber, $adminId) {
            $this->ensureRegistrationIsActive($tournament, $registration);

            $sourceSeat = LiveTableSeat::query()
                ->where('tournament_id', $tournament->id)
                ->where('tournament_registration_id', $registration->id)
                ->lockForUpdate()
                ->first();

            $targetSeat = LiveTableSeat::query()
                ->where('tournament_id', $tournament->id)
                ->where('table_key', $tableKey)
                ->where('seat_number', $toSeatNumber)
                ->lockForUpdate()
                ->first();

            if ($sourceSeat && $sourceSeat->table_key === $tableKey && $sourceSeat->seat_number === $toSeatNumber) {
                return;
            }

            if ($sourceSeat && $targetSeat && $targetSeat->tournament_registration_id !== $registration->id) {
                $fromTableKey = $sourceSeat->table_key;
                $fromSeatNumber = $sourceSeat->seat_number;
                $replacedRegistrationId = $targetSeat->tournament_registration_id;

                $sourceSeat->update(['seat_number' => 0]);
                $targetSeat->update([
                    'table_key' => $fromTableKey,
                    'seat_number' => $fromSeatNumber,
                ]);
                $sourceSeat->update([
                    'table_key' => $tableKey,
                    'seat_number' => $toSeatNumber,
                ]);

                $this->recordEvent(
                    tournament: $tournament,
                    tableKey: $tableKey,
                    registration: $registration,
                    eventType: 'seat_swapped',
                    fromTableKey: $fromTableKey,
                    fromSeatNumber: $fromSeatNumber,
                    toTableKey: $tableKey,
                    toSeatNumber: $toSeatNumber,
                    metadata: ['swappedRegistrationId' => $replacedRegistrationId],
                    adminId: $adminId,
                );

                return;
            }

            if ($sourceSeat) {
                $fromTableKey = $sourceSeat->table_key;
                $fromSeatNumber = $sourceSeat->seat_number;

                $sourceSeat->update([
                    'table_key' => $tableKey,
                    'seat_number' => $toSeatNumber,
                ]);

                $this->recordEvent(
                    tournament: $tournament,
                    tableKey: $tableKey,
                    registration: $registration,
                    eventType: 'seat_moved',
                    fromTableKey: $fromTableKey,
                    fromSeatNumber: $fromSeatNumber,
                    toTableKey: $tableKey,
                    toSeatNumber: $toSeatNumber,
                    adminId: $adminId,
                );

                return;
            }

            if ($targetSeat) {
                $replacedRegistrationId = $targetSeat->tournament_registration_id;
                $targetSeat->delete();
            }

            LiveTableSeat::query()->create([
                'table_key' => $tableKey,
                'tournament_id' => $tournament->id,
                'tournament_registration_id' => $registration->id,
                'seat_number' => $toSeatNumber,
            ]);

            $this->recordEvent(
                tournament: $tournament,
                tableKey: $tableKey,
                registration: $registration,
                eventType: 'seat_assigned',
                toTableKey: $tableKey,
                toSeatNumber: $toSeatNumber,
                metadata: isset($replacedRegistrationId) ? ['replacedRegistrationId' => $replacedRegistrationId] : null,
                adminId: $adminId,
            );
        });
    }

    public function clearSeat(string $tableKey, Tournament $tournament, int $seatNumber, ?int $adminId = null): void
    {
        $this->validateTableKey($tableKey);
        $this->validateSeatNumber($seatNumber);

        DB::transaction(function () use ($tableKey, $tournament, $seatNumber, $adminId) {
            $seat = LiveTableSeat::query()
                ->where('tournament_id', $tournament->id)
                ->where('table_key', $tableKey)
                ->where('seat_number', $seatNumber)
                ->lockForUpdate()
                ->first();

            if (! $seat) {
                return;
            }

            $registration = $seat->registration()->with('user')->first();
            $seat->delete();

            $this->recordEvent(
                tournament: $tournament,
                tableKey: $tableKey,
                registration: $registration,
                eventType: 'seat_cleared',
                fromTableKey: $tableKey,
                fromSeatNumber: $seatNumber,
                adminId: $adminId,
            );
        });
    }

    public function eliminateSeat(string $tableKey, Tournament $tournament, int $seatNumber, ?string $note = null, ?int $adminId = null): void
    {
        $this->validateTableKey($tableKey);
        $this->validateSeatNumber($seatNumber);

        DB::transaction(function () use ($tableKey, $tournament, $seatNumber, $note, $adminId) {
            $seat = LiveTableSeat::query()
                ->where('tournament_id', $tournament->id)
                ->where('table_key', $tableKey)
                ->where('seat_number', $seatNumber)
                ->lockForUpdate()
                ->first();

            if (! $seat) {
                throw ValidationException::withMessages([
                    'seatNumber' => 'Ghế này chưa có người chơi.',
                ]);
            }

            $registration = $seat->registration()->with('user')->firstOrFail();
            $seat->delete();

            LiveTournamentPlayerState::query()->updateOrCreate(
                [
                    'tournament_id' => $tournament->id,
                    'tournament_registration_id' => $registration->id,
                ],
                [
                    'state' => 'eliminated',
                    'state_changed_at' => now(),
                ],
            );

            $this->recordEvent(
                tournament: $tournament,
                tableKey: $tableKey,
                registration: $registration,
                eventType: 'player_eliminated',
                fromTableKey: $tableKey,
                fromSeatNumber: $seatNumber,
                metadata: $note ? ['note' => $note] : null,
                adminId: $adminId,
            );
        });
    }

    public function rebuy(Tournament $tournament, TournamentRegistration $registration, ?int $adminId = null): void
    {
        $this->assertRegistrationBelongsToTournament($registration, $tournament);

        DB::transaction(function () use ($tournament, $registration, $adminId) {
            LiveTournamentPlayerState::query()
                ->where('tournament_id', $tournament->id)
                ->where('tournament_registration_id', $registration->id)
                ->delete();

            $this->recordEvent(
                tournament: $tournament,
                registration: $registration,
                eventType: 'player_rebuy',
                adminId: $adminId,
            );
        });
    }

    private function ensureTable(string $tableKey): LiveTable
    {
        $this->validateTableKey($tableKey);

        return LiveTable::query()->firstOrCreate(
            ['key' => $tableKey],
            ['name' => self::TABLES[$tableKey]],
        );
    }

    private function validateTableKey(string $tableKey): void
    {
        if (! array_key_exists($tableKey, self::TABLES)) {
            throw ValidationException::withMessages([
                'tableKey' => 'Bàn live không hợp lệ.',
            ]);
        }
    }

    private function validateSeatNumber(int $seatNumber): void
    {
        if ($seatNumber < 1 || $seatNumber > 9) {
            throw ValidationException::withMessages([
                'seatNumber' => 'Số ghế phải nằm trong khoảng 1 đến 9.',
            ]);
        }
    }

    private function assertRegistrationBelongsToTournament(TournamentRegistration $registration, Tournament $tournament): void
    {
        if ($registration->tournament_id !== $tournament->id) {
            throw ValidationException::withMessages([
                'tournamentRegistrationId' => 'Người chơi không thuộc giải đấu này.',
            ]);
        }

        if ($registration->status === TournamentRegistrationStatusEnum::Cancelled) {
            throw ValidationException::withMessages([
                'tournamentRegistrationId' => 'Đăng ký này đã bị hủy.',
            ]);
        }
    }

    private function ensureRegistrationIsActive(Tournament $tournament, TournamentRegistration $registration): void
    {
        $isEliminated = LiveTournamentPlayerState::query()
            ->where('tournament_id', $tournament->id)
            ->where('tournament_registration_id', $registration->id)
            ->where('state', 'eliminated')
            ->exists();

        if ($isEliminated) {
            throw ValidationException::withMessages([
                'tournamentRegistrationId' => 'Người chơi đã cháy, cần re-buy trước khi xếp lại bàn.',
            ]);
        }
    }

    /**
     * @param array<string, mixed>|null $metadata
     */
    private function recordEvent(
        Tournament $tournament,
        string $eventType,
        ?string $tableKey = null,
        ?TournamentRegistration $registration = null,
        ?string $fromTableKey = null,
        ?int $fromSeatNumber = null,
        ?string $toTableKey = null,
        ?int $toSeatNumber = null,
        ?array $metadata = null,
        ?int $adminId = null,
    ): void {
        TournamentLiveEvent::query()->create([
            'tournament_id' => $tournament->id,
            'table_key' => $tableKey,
            'tournament_registration_id' => $registration?->id,
            'user_id' => $registration?->user_id,
            'created_by_admin_id' => $adminId,
            'event_type' => $eventType,
            'from_table_key' => $fromTableKey,
            'from_seat_number' => $fromSeatNumber,
            'to_table_key' => $toTableKey,
            'to_seat_number' => $toSeatNumber,
            'metadata' => $metadata,
        ]);
    }
}
