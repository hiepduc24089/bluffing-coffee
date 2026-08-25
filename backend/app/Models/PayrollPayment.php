<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollPayment extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'admin_id',
        'period_month',
        'total_hours',
        'hourly_rate',
        'total_pay',
        'paid_at',
        'paid_by_admin_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_month' => 'date',
            'total_hours' => 'float',
            'hourly_rate' => 'integer',
            'total_pay' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'paid_by_admin_id');
    }
}
