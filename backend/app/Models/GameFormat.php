<?php

namespace App\Models;

use App\Enums\TournamentTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameFormat extends Model
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
        'max_rebuy',
        'rebuy_stack',
        'description',
        'is_active',
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
            'max_rebuy' => 'integer',
            'rebuy_stack' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function levels(): HasMany
    {
        return $this->hasMany(GameFormatLevel::class)->orderBy('position');
    }

    public function tournaments(): HasMany
    {
        return $this->hasMany(Tournament::class);
    }
}
