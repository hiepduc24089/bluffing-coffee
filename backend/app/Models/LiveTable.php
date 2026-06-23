<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveTable extends Model
{
    protected $fillable = [
        'key',
        'name',
        'current_tournament_id',
    ];

    public function currentTournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class, 'current_tournament_id');
    }
}
