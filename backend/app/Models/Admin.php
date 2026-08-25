<?php

namespace App\Models;

use App\Enums\StaffPositionEnum;
use Database\Factories\AdminFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    /** @use HasFactory<AdminFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_super_admin',
        'position',
        'hourly_rate',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
            'position' => StaffPositionEnum::class,
            'hourly_rate' => 'integer',
        ];
    }

    public function shiftAssignments(): HasMany
    {
        return $this->hasMany(ShiftAssignment::class);
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(AdminPermission::class);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->is_super_admin) {
            return true;
        }

        return $this->permissions
            ->contains(fn (AdminPermission $granted) => $granted->permission === $permission);
    }

    /**
     * @return array<int, string>
     */
    public function permissionKeys(): array
    {
        return $this->permissions->pluck('permission')->values()->all();
    }
}
