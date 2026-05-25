<?php

namespace App\Enums;

enum TournamentStatusEnum: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Running = 'running';
    case Completed = 'completed';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
