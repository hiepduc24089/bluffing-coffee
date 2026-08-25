<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Dùng chung cho cả đánh dấu đã trả và hủy đánh dấu — cả hai chỉ cần biết tháng.
 */
class PayrollPaymentRequest extends FormRequest
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
            'month' => ['required', 'date_format:Y-m'],
        ];
    }
}
