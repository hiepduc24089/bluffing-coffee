<?php

namespace App\Models;

use App\Enums\TournamentStatusEnum;
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
        'buy_in',
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

    public function registrations(): HasMany
    {
        return $this->hasMany(TournamentRegistration::class);
    }
}
