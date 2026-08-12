<?php

namespace App\Services;

use App\Enums\AdminModuleEnum;
use App\Enums\AdminSpecialPermissionEnum;

/**
 * Nguồn duy nhất mô tả toàn bộ quyền có thể gán. Frontend dựng ma trận từ đây
 * nên không phải hardcode lại danh sách module.
 */
class AdminPermissionCatalog
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'modules' => array_map(
                fn (AdminModuleEnum $module) => [
                    'key' => $module->value,
                    'label' => $module->label(),
                    'actions' => array_map(
                        fn ($action) => [
                            'key' => $action->value,
                            'label' => $action->label(),
                            'permission' => $module->permission($action),
                        ],
                        $module->actions(),
                    ),
                ],
                AdminModuleEnum::cases(),
            ),
            'specialPermissions' => array_map(
                fn (AdminSpecialPermissionEnum $special) => [
                    'permission' => $special->value,
                    'label' => $special->label(),
                ],
                AdminSpecialPermissionEnum::cases(),
            ),
        ];
    }

    /**
     * @return array<int, string>
     */
    public function allPermissions(): array
    {
        $modulePermissions = array_merge(
            ...array_map(
                fn (AdminModuleEnum $module) => $module->permissions(),
                AdminModuleEnum::cases(),
            ),
        );

        return array_values(array_merge($modulePermissions, AdminSpecialPermissionEnum::values()));
    }
}
