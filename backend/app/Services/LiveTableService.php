<?php

namespace App\Services;

use App\Enums\LiveTableEventTypeEnum;
use App\Enums\LiveTableSeatingStrategyEnum;
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

    public const MAX_SEATS = 9;

    public function __construct(
        private readonly TournamentPurchaseService $purchaseService,
    ) {
    }

    /**
     * @return Collection<int, Tournament>
     */
    public function todayTournaments(): Collection
    {
        return Tournament::query()
            ->with('tournamentTemplate')
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
            ? Tournament::query()->with('tournamentTemplate')->find($resolvedTournamentId)
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
                eventType: LiveTableEventTypeEnum::TableSelected,
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
                    eventType: LiveTableEventTypeEnum::SeatSwapped,
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
                    eventType: LiveTableEventTypeEnum::SeatMoved,
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
                eventType: LiveTableEventTypeEnum::SeatAssigned,
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
                eventType: LiveTableEventTypeEnum::SeatCleared,
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
                eventType: LiveTableEventTypeEnum::PlayerEliminated,
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
            // Ghi tiền trước khi cho người chơi ngồi lại. Ghi hỏng thì cả
            // transaction bị huỷ, không có chuyện hồi sinh mà không có dòng
            // tiền nào — đó chính là tình trạng trước khi có sổ mua.
            $purchase = $this->purchaseService->recordRebuy(
                $registration->loadMissing('tournament'),
                $adminId,
            );

            LiveTournamentPlayerState::query()
                ->where('tournament_id', $tournament->id)
                ->where('tournament_registration_id', $registration->id)
                ->delete();

            $this->recordEvent(
                tournament: $tournament,
                registration: $registration,
                eventType: LiveTableEventTypeEnum::PlayerRebuy,
                adminId: $adminId,
                metadata: [
                    'purchase_id' => $purchase->getKey(),
                    'price' => $purchase->price,
                ],
            );
        });
    }

    /**
     * Ảnh chụp cả ba bàn của một giải, dùng cho màn gom bàn: cần biết bàn nào
     * còn ai trước khi quyết định gom về đâu.
     *
     * @return array<int, array<string, mixed>>
     */
    public function tournamentOverview(Tournament $tournament): array
    {
        $tables = LiveTable::query()->get()->keyBy('key');

        $seatsByTable = LiveTableSeat::query()
            ->with('registration.user')
            ->where('tournament_id', $tournament->id)
            ->orderBy('seat_number')
            ->get()
            ->groupBy('table_key');

        $overview = [];

        foreach (self::TABLES as $tableKey => $tableName) {
            $seats = $seatsByTable->get($tableKey, collect());

            $overview[] = [
                'key' => $tableKey,
                'name' => $tables->get($tableKey)?->name ?? $tableName,
                'isCurrentTournament' => $tables->get($tableKey)?->current_tournament_id === $tournament->id,
                'seats' => $seats,
            ];
        }

        return $overview;
    }

    /**
     * Gom người chơi còn lại ở các bàn nguồn về bàn đích để đánh final.
     *
     * Người chơi chỉ có đúng một ghế trong cả giải (unique tournament +
     * registration), nên gom bàn chỉ là đổi `table_key` và bốc lại số ghế trên
     * chính dòng đó — không xoá rồi tạo lại, nhờ vậy không có khoảnh khắc nào
     * người chơi bị rơi ra khỏi bàn.
     *
     * @param  array<int, string>  $sourceTableKeys
     */
    public function mergeTables(
        Tournament $tournament,
        string $targetTableKey,
        array $sourceTableKeys,
        LiveTableSeatingStrategyEnum $strategy = LiveTableSeatingStrategyEnum::Random,
        ?int $adminId = null,
    ): void {
        $this->validateTableKey($targetTableKey);

        $sourceTableKeys = array_values(array_diff(array_unique($sourceTableKeys), [$targetTableKey]));

        foreach ($sourceTableKeys as $sourceTableKey) {
            $this->validateTableKey($sourceTableKey);
        }

        if ($sourceTableKeys === []) {
            throw ValidationException::withMessages([
                'sourceTableKeys' => 'Chọn ít nhất một bàn nguồn khác bàn đích.',
            ]);
        }

        DB::transaction(function () use ($tournament, $targetTableKey, $sourceTableKeys, $strategy, $adminId) {
            // Khoá toàn bộ ghế của giải theo cùng một thứ tự để hai admin cùng
            // bấm gom bàn không kẹt nhau và không đọc trúng số ghế đã cũ.
            $seats = LiveTableSeat::query()
                ->where('tournament_id', $tournament->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $incomingSeats = $seats->whereIn('table_key', $sourceTableKeys)->values();

            if ($incomingSeats->isEmpty()) {
                throw ValidationException::withMessages([
                    'sourceTableKeys' => 'Các bàn đã chọn không còn người chơi nào để gom.',
                ]);
            }

            $occupiedSeatNumbers = $seats->where('table_key', $targetTableKey)->pluck('seat_number');
            $totalPlayers = $occupiedSeatNumbers->count() + $incomingSeats->count();

            if ($totalPlayers > self::MAX_SEATS) {
                throw ValidationException::withMessages([
                    'sourceTableKeys' => sprintf(
                        'Tổng %d người vượt quá %d ghế của %s. Hãy gom ít bàn hơn.',
                        $totalPlayers,
                        self::MAX_SEATS,
                        self::TABLES[$targetTableKey],
                    ),
                ]);
            }

            $freeSeatNumbers = collect(range(1, self::MAX_SEATS))
                ->diff($occupiedSeatNumbers)
                ->values();

            if ($strategy === LiveTableSeatingStrategyEnum::Random) {
                $freeSeatNumbers = $freeSeatNumbers->shuffle()->values();
            }

            $incomingSeats->load('registration.user');
            $movements = [];

            foreach ($incomingSeats as $index => $seat) {
                $fromTableKey = $seat->table_key;
                $fromSeatNumber = $seat->seat_number;
                $toSeatNumber = (int) $freeSeatNumbers[$index];

                $seat->update([
                    'table_key' => $targetTableKey,
                    'seat_number' => $toSeatNumber,
                ]);

                $this->recordEvent(
                    tournament: $tournament,
                    tableKey: $targetTableKey,
                    registration: $seat->registration,
                    eventType: LiveTableEventTypeEnum::SeatMoved,
                    fromTableKey: $fromTableKey,
                    fromSeatNumber: $fromSeatNumber,
                    toTableKey: $targetTableKey,
                    toSeatNumber: $toSeatNumber,
                    metadata: ['mergedFromTableKey' => $fromTableKey],
                    adminId: $adminId,
                );

                $movements[] = [
                    'tournamentRegistrationId' => $seat->tournament_registration_id,
                    'fromTableKey' => $fromTableKey,
                    'fromSeatNumber' => $fromSeatNumber,
                    'toSeatNumber' => $toSeatNumber,
                ];
            }

            // Bàn đích chắc chắn đang chạy giải này, còn bàn nguồn đã hết người
            // nên trả về rảnh để dùng cho giải khác.
            $this->ensureTable($targetTableKey)->update(['current_tournament_id' => $tournament->id]);

            LiveTable::query()
                ->whereIn('key', $sourceTableKeys)
                ->where('current_tournament_id', $tournament->id)
                ->update(['current_tournament_id' => null]);

            $this->recordEvent(
                tournament: $tournament,
                tableKey: $targetTableKey,
                eventType: LiveTableEventTypeEnum::TablesMerged,
                toTableKey: $targetTableKey,
                metadata: [
                    'sourceTableKeys' => $sourceTableKeys,
                    'targetTableKey' => $targetTableKey,
                    'seatingStrategy' => $strategy->value,
                    'movedCount' => count($movements),
                    'totalPlayers' => $totalPlayers,
                    'movements' => $movements,
                ],
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
        if ($seatNumber < 1 || $seatNumber > self::MAX_SEATS) {
            throw ValidationException::withMessages([
                'seatNumber' => sprintf('Số ghế phải nằm trong khoảng 1 đến %d.', self::MAX_SEATS),
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
        LiveTableEventTypeEnum $eventType,
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
            'event_type' => $eventType->value,
            'from_table_key' => $fromTableKey,
            'from_seat_number' => $fromSeatNumber,
            'to_table_key' => $toTableKey,
            'to_seat_number' => $toSeatNumber,
            'metadata' => $metadata,
        ]);
    }
}
