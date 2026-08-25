<?php

namespace App\Http\Resources;

use App\Enums\AdminSpecialPermissionEnum;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Admin
 */
class StaffResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'isSuperAdmin' => (bool) $this->is_super_admin,
            'position' => $this->position?->value,
            'positionLabel' => $this->position?->label(),
            // Lương chỉ hiện với người được cấp quyền xem bảng lương toàn quán.
            'hourlyRate' => $this->when(
                $request->user()?->hasPermission(AdminSpecialPermissionEnum::ViewAllPayroll->value) === true,
                fn () => $this->hourly_rate,
            ),
            'permissions' => $this->whenLoaded('permissions', fn () => $this->permissionKeys(), []),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
