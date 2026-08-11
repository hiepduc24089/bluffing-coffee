<?php

namespace App\Models;

use App\Enums\TournamentStatusEnum;
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
        'game_format_id',
        'buy_in',
        'ticket_price_with_drink',
        'ticket_price_without_drink',
        'capacity',
        'status',
        'reward_profile_id',
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
            'game_format_id' => 'integer',
            'ticket_price_with_drink' => 'integer',
            'ticket_price_without_drink' => 'integer',
            'capacity' => 'integer',
            'status' => TournamentStatusEnum::class,
            'reward_profile_id' => 'integer',
            'start_at' => 'datetime',
        ];
    }

    public function rewardProfile(): BelongsTo
    {
        return $this->belongsTo(RewardProfile::class);
    }

    public function gameFormat(): BelongsTo
    {
        return $this->belongsTo(GameFormat::class);
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
