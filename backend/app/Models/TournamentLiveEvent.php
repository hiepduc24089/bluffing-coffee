<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TournamentLiveEvent extends Model
{
    protected $fillable = [
        'tournament_id',
        'table_key',
        'tournament_registration_id',
        'user_id',
        'created_by_admin_id',
        'event_type',
        'from_table_key',
        'from_seat_number',
        'to_table_key',
        'to_seat_number',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'from_seat_number' => 'integer',
            'to_seat_number' => 'integer',
            'metadata' => 'array',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }
}
