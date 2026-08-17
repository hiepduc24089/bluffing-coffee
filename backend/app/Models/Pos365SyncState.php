<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pos365SyncState extends Model
{
    protected $fillable = [
        'key',
        'cursor',
        'last_run_at',
        'last_success_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'last_run_at' => 'datetime',
            'last_success_at' => 'datetime',
        ];
    }
}
