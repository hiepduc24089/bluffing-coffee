<?php

namespace App\Models;

use App\Enums\ShiftSlotEnum;
use App\Enums\StaffPositionEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftAssignment extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'admin_id',
        'work_date',
        'slot',
        'role',
        'note',
        'created_by_admin_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'slot' => ShiftSlotEnum::class,
            'role' => StaffPositionEnum::class,
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }
}
