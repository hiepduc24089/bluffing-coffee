<?php

namespace App\Http\Requests\Staff;

use App\Enums\StaffPositionEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', $this->emailUniqueRule()],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            // Bỏ trống nghĩa là tài khoản này không tham gia xếp ca.
            'position' => ['nullable', 'string', Rule::in(StaffPositionEnum::values())],
            'hourlyRate' => ['nullable', 'integer', 'min:0', 'max:100000000'],
        ];
    }

    protected function emailUniqueRule(): object
    {
        return Rule::unique('admins', 'email');
    }
}
