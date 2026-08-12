<?php

namespace App\Services;

use App\Models\Admin;
use App\Repositories\StaffRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StaffService
{
    public function __construct(
        private readonly StaffRepository $staffRepository,
    ) {
    }

    public function paginate(?string $search, int $perPage): LengthAwarePaginator
    {
        return $this->staffRepository->paginate($search, $perPage);
    }

    /**
     * @param array{name: string, email: string, password: string} $payload
     */
    public function create(array $payload): Admin
    {
        return DB::transaction(fn () => $this->staffRepository->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => $payload['password'],
            'is_super_admin' => false,
        ])->load('permissions'));
    }

    /**
     * @param array{name: string, email: string, password?: string|null} $payload
     */
    public function update(Admin $staff, array $payload, Admin $actor): Admin
    {
        $this->guardEditable($staff, $actor);

        return DB::transaction(function () use ($staff, $payload) {
            $attributes = [
                'name' => $payload['name'],
                'email' => $payload['email'],
            ];

            if (! empty($payload['password'])) {
                $attributes['password'] = $payload['password'];
            }

            return $this->staffRepository->update($staff, $attributes)->load('permissions');
        });
    }

    /**
     * @param array<int, string> $permissions
     */
    public function syncPermissions(Admin $staff, array $permissions, Admin $actor): Admin
    {
        $this->guardEditable($staff, $actor);

        return DB::transaction(function () use ($staff, $permissions) {
            $this->staffRepository->syncPermissions($staff, array_values(array_unique($permissions)));

            return $staff->load('permissions');
        });
    }

    public function delete(Admin $staff, Admin $actor): void
    {
        $this->guardEditable($staff, $actor);

        DB::transaction(fn () => $this->staffRepository->delete($staff));
    }

    /**
     * Chủ quán không bị ai sửa quyền, và không ai tự sửa quyền của chính mình —
     * nếu không, một nhân viên có quyền quản lý nhân viên có thể tự nâng quyền.
     */
    private function guardEditable(Admin $staff, Admin $actor): void
    {
        if ($staff->is_super_admin) {
            throw ValidationException::withMessages([
                'staff' => 'Không thể chỉnh sửa tài khoản chủ quán.',
            ]);
        }

        if ($staff->getKey() === $actor->getKey()) {
            throw ValidationException::withMessages([
                'staff' => 'Không thể tự chỉnh sửa tài khoản của chính mình.',
            ]);
        }
    }
}
