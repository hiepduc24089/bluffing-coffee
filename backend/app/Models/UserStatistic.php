<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStatistic extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'total_bp_earned',
        'tournaments_played',
        'championships_won',
        'sitngo_wins',
        'turbo_wins',
        'deepstack_wins',
        'last_played_at',
    ];

    protected function casts(): array
    {
        return [
            'total_bp_earned' => 'integer',
            'tournaments_played' => 'integer',
            'championships_won' => 'integer',
            'sitngo_wins' => 'integer',
            'turbo_wins' => 'integer',
            'deepstack_wins' => 'integer',
            'last_played_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
