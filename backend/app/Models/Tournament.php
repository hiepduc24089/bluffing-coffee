<?php

namespace App\Models;

use App\Enums\TournamentTypeEnum;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'tournament_type',
        'tournament_template_id',
        'buy_in',
        'ticket_price_with_drink',
        'ticket_price_without_drink',
        'capacity',
        'finalized_at',
        'start_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'buy_in' => 'integer',
            'tournament_type' => TournamentTypeEnum::class,
            'tournament_template_id' => 'integer',
            'ticket_price_with_drink' => 'integer',
            'ticket_price_without_drink' => 'integer',
            'capacity' => 'integer',
            'finalized_at' => 'datetime',
            'start_at' => 'datetime',
        ];
    }

    public function tournamentTemplate(): BelongsTo
    {
        return $this->belongsTo(TournamentTemplate::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(TournamentRegistration::class);
    }

    public function liveTables(): HasMany
    {
        return $this->hasMany(LiveTable::class, 'current_tournament_id');
    }

}
