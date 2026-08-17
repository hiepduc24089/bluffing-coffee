<?php

namespace App\Models;

use App\Enums\TournamentPurchaseKindEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TournamentPurchase extends Model
{
    protected $fillable = [
        'tournament_registration_id',
        'kind',
        'entry_type',
        'price',
        'created_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'kind' => TournamentPurchaseKindEnum::class,
            'price' => 'integer',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(TournamentRegistration::class, 'tournament_registration_id');
    }

    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }
}
