<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TournamentTemplateReward extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'tournament_template_id',
        'position',
        'bp_reward',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'bp_reward' => 'integer',
        ];
    }

    public function tournamentTemplate(): BelongsTo
    {
        return $this->belongsTo(TournamentTemplate::class);
    }
}
