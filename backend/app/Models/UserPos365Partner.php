<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPos365Partner extends Model
{
    protected $fillable = [
        'user_id',
        'pos365_partner_id',
        'pos365_code',
        'is_primary',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'pos365_partner_id' => 'integer',
            'is_primary' => 'boolean',
            'last_synced_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
