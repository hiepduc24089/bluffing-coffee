<?php

namespace App\Models;

use App\Enums\DayTypeEnum;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

class ShiftSetting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'day_type',
        'start_time',
        'end_time',
        'max_barista',
        'max_dealer',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day_type' => DayTypeEnum::class,
            'max_barista' => 'integer',
            'max_dealer' => 'integer',
        ];
    }

    public function opensAtOn(CarbonInterface $date): CarbonInterface
    {
        return $this->applyTimeTo($date, $this->start_time);
    }

    public function closesAtOn(CarbonInterface $date): CarbonInterface
    {
        return $this->applyTimeTo($date, $this->end_time);
    }

    private function applyTimeTo(CarbonInterface $date, string $time): CarbonInterface
    {
        [$hour, $minute] = array_map('intval', explode(':', $time));

        return $date->copy()->setTime($hour, $minute);
    }
}
