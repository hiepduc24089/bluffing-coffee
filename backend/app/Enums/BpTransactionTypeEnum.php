<?php

namespace App\Enums;

enum BpTransactionTypeEnum: string
{
    case Earned = 'earned';
    case Spent = 'spent';
    case Adjusted = 'adjusted';
    case Expired = 'expired';
    case Reversed = 'reversed';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
