<?php

namespace App\Models;

use App\Enums\Pos365PartnerImportStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pos365PartnerImport extends Model
{
    protected $fillable = [
        'pos365_partner_id',
        'pos365_code',
        'name',
        'phone',
        'phone_e164',
        'status',
        'payload',
        'user_id',
        'note',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'pos365_partner_id' => 'integer',
            'status' => Pos365PartnerImportStatusEnum::class,
            'payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
