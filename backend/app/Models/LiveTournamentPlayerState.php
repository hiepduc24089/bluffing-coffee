<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveTournamentPlayerState extends Model
{
    protected $fillable = [
        'tournament_id',
        'tournament_registration_id',
        'state',
        'state_changed_at',
    ];

    protected function casts(): array
    {
        return [
            'state_changed_at' => 'datetime',
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(TournamentRegistration::class, 'tournament_registration_id');
    }
}
