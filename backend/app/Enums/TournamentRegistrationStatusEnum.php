<?php

namespace App\Enums;

enum TournamentRegistrationStatusEnum: string
{
    case Registered = 'registered';
    case Finished = 'finished';
    case Cancelled = 'cancelled';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
