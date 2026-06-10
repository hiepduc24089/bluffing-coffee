<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RewardProfileItem extends Model
{
    protected $fillable = [
        'reward_profile_id',
        'position',
        'bp_reward',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'bp_reward' => 'integer',
        ];
    }

    public function rewardProfile(): BelongsTo
    {
        return $this->belongsTo(RewardProfile::class);
    }
}
