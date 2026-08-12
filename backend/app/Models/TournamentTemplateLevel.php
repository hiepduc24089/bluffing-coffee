<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TournamentTemplateLevel extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'tournament_template_id',
        'position',
        'level_number',
        'small_blind',
        'big_blind',
        'ante',
        'duration_minutes',
        'is_break',
        'note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'level_number' => 'integer',
            'small_blind' => 'integer',
            'big_blind' => 'integer',
            'ante' => 'integer',
            'duration_minutes' => 'integer',
            'is_break' => 'boolean',
        ];
    }

    public function tournamentTemplate(): BelongsTo
    {
        return $this->belongsTo(TournamentTemplate::class);
    }
}
