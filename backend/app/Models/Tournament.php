<?php

namespace App\Models;

use App\Enums\TournamentStatusEnum;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tournament extends Model
{
    /** @use HasFactory<\Database\Factories\TournamentFactory> */
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'buy_in',
        'capacity',
        'status',
        'start_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'buy_in' => 'integer',
            'capacity' => 'integer',
            'status' => TournamentStatusEnum::class,
            'start_at' => 'datetime',
        ];
    }
}
