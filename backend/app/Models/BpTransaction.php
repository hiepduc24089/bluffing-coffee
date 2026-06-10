<?php

namespace App\Models;

use App\Enums\BpTransactionTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BpTransaction extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'amount',
        'transaction_type',
        'reference_type',
        'reference_id',
        'reward_key',
        'expires_at',
        'note',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'transaction_type' => BpTransactionTypeEnum::class,
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }
}
