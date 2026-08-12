<?php

namespace App\Http\Requests\Staff;

use Illuminate\Validation\Rule;

class UpdateStaffRequest extends StoreStaffRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            // Bỏ trống nghĩa là giữ nguyên mật khẩu hiện tại.
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
        ];
    }

    protected function emailUniqueRule(): object
    {
        return Rule::unique('admins', 'email')->ignore($this->route('staff')?->id);
    }
}
