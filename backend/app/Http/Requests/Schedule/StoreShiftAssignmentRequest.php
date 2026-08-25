<?php

namespace App\Http\Requests\Schedule;

use App\Enums\ShiftSlotEnum;
use App\Enums\StaffPositionEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShiftAssignmentRequest extends FormRequest
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
            'staffId' => ['required', 'integer', 'exists:admins,id'],
            'workDate' => ['required', 'date_format:Y-m-d'],
            'slot' => ['required', 'string', Rule::in(ShiftSlotEnum::values())],
            // Bỏ trống thì lấy đúng vị trí trong hồ sơ nhân viên.
            'role' => ['nullable', 'string', Rule::in(StaffPositionEnum::values())],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
