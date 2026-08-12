<?php

namespace App\DTOs;

use App\Enums\TournamentTypeEnum;
use Carbon\CarbonImmutable;

readonly class TournamentDTO
{
    public function __construct(
        public string $name,
        public TournamentTypeEnum $tournamentType,
        public ?int $tournamentTemplateId,
        public int $buyIn,
        public int $ticketPriceWithDrink,
        public int $ticketPriceWithoutDrink,
        public int $capacity,
        public CarbonImmutable $startAt,
    ) {
    }

    /**
     * @param array{name: string, tournamentType?: string, tournamentTemplateId?: int|null, buyIn?: int, capacity: int, startAt: string} $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            name: $payload['name'],
            tournamentType: TournamentTypeEnum::from($payload['tournamentType'] ?? TournamentTypeEnum::Normal->value),
            tournamentTemplateId: isset($payload['tournamentTemplateId']) ? (int) $payload['tournamentTemplateId'] : null,
            buyIn: (int) ($payload['buyIn'] ?? 0),
            ticketPriceWithDrink: (int) ($payload['ticketPriceWithDrink'] ?? 0),
            ticketPriceWithoutDrink: (int) ($payload['ticketPriceWithoutDrink'] ?? 0),
            capacity: (int) $payload['capacity'],
            startAt: CarbonImmutable::parse($payload['startAt']),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabasePayload(): array
    {
        return [
            'name' => $this->name,
            'tournament_type' => $this->tournamentType->value,
            'tournament_template_id' => $this->tournamentTemplateId,
            'buy_in' => $this->buyIn,
            'ticket_price_with_drink' => $this->ticketPriceWithDrink,
            'ticket_price_without_drink' => $this->ticketPriceWithoutDrink,
            'capacity' => $this->capacity,
            'start_at' => $this->startAt,
        ];
    }
}
