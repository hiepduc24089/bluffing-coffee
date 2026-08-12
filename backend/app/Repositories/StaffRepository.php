<?php

namespace App\Repositories;

use App\Models\Admin;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class StaffRepository
{
    public function paginate(?string $search, int $perPage): LengthAwarePaginator
    {
        return Admin::query()
            ->with('permissions')
            ->when($search, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            })
            ->orderByDesc('is_super_admin')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): Admin
    {
        return Admin::query()->create($payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(Admin $staff, array $payload): Admin
    {
        $staff->update($payload);

        return $staff->refresh();
    }

    public function delete(Admin $staff): void
    {
        $staff->delete();
    }

    /**
     * @param array<int, string> $permissions
     */
    public function syncPermissions(Admin $staff, array $permissions): void
    {
        $staff->permissions()->delete();

        if ($permissions === []) {
            return;
        }

        $staff->permissions()->createMany(
            array_map(fn (string $permission) => ['permission' => $permission], $permissions),
        );
    }
}
