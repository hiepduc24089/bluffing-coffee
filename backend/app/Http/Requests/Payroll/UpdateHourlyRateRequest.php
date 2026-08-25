<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHourlyRateRequest extends FormRequest
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
            // Bỏ trống nghĩa là chưa chốt lương cho bạn này.
            'hourlyRate' => ['nullable', 'integer', 'min:0', 'max:100000000'],
        ];
    }
}
