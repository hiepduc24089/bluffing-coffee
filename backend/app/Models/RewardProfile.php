<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RewardProfile extends Model
{
    protected $fillable = [
        'name',
        'code',
        'is_active',
        'default_price_with_drink',
        'default_price_without_drink',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'default_price_with_drink' => 'integer',
            'default_price_without_drink' => 'integer',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(RewardProfileItem::class);
    }
}
