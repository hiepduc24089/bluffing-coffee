<?php

namespace App\Models;

use App\Enums\TournamentRegistrationStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TournamentRegistration extends Model
{
    protected $fillable = [
        'tournament_id',
        'user_id',
        'status',
        'final_position',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => TournamentRegistrationStatusEnum::class,
            'final_position' => 'integer',
            'finished_at' => 'datetime',
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
