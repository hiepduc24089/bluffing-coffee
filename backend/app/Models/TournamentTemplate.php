<?php

namespace App\Models;

use App\Enums\TournamentTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TournamentTemplate extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'tournament_type',
        'starting_stack',
        'late_reg_until_level',
        'rebuy_stack',
        'description',
        'default_price_with_drink',
        'default_price_without_drink',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tournament_type' => TournamentTypeEnum::class,
            'starting_stack' => 'integer',
            'late_reg_until_level' => 'integer',
            'rebuy_stack' => 'integer',
            'default_price_with_drink' => 'integer',
            'default_price_without_drink' => 'integer',
        ];
    }

    public function levels(): HasMany
    {
        return $this->hasMany(TournamentTemplateLevel::class)->orderBy('position');
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(TournamentTemplateReward::class)->orderBy('position');
    }

    public function tournaments(): HasMany
    {
        return $this->hasMany(Tournament::class);
    }
}
