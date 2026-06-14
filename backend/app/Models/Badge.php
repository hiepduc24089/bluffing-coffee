<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    public const SYSTEM_BADGES = [
        'FIRST_WIN' => [
            'name' => 'First Win',
            'description' => 'Won the first tournament.',
        ],
        'TEN_TOURNAMENTS' => [
            'name' => '10 Tournaments',
            'description' => 'Played 10 tournaments.',
        ],
        'CHAMPION' => [
            'name' => 'Champion',
            'description' => 'Won a tournament.',
        ],
        'DEEPSTACK_WINNER' => [
            'name' => 'DeepStack Winner',
            'description' => 'Won a DeepStack event.',
        ],
        'TURBO_KING' => [
            'name' => 'Turbo King',
            'description' => 'Won a Turbo event.',
        ],
        'SITNGO_REGULAR' => [
            'name' => 'Sit & Go Regular',
            'description' => 'A regular Sit & Go player.',
        ],
    ];

    protected $fillable = [
        'name',
        'code',
        'icon',
        'description',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }
}
