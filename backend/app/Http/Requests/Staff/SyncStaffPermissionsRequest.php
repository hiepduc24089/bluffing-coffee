<?php

namespace App\Http\Requests\Staff;

use App\Services\AdminPermissionCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncStaffPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'permissions' => ['present', 'array'],
            'permissions.*' => [
                'string',
                Rule::in(app(AdminPermissionCatalog::class)->allPermissions()),
            ],
        ];
    }
}
