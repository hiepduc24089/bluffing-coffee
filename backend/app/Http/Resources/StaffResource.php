<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Admin
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
            'permissions' => $this->whenLoaded('permissions', fn () => $this->permissionKeys(), []),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
