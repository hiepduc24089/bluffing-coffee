<?php

namespace App\Enums;

enum TournamentTypeEnum: string
{
    case Normal = 'normal';
    case DeepStack = 'deepstack';
    case Turbo = 'turbo';
    case SitNgo = 'sitngo';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
