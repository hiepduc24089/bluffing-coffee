<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleIndexRequest extends FormRequest
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
            'from' => ['required', 'date_format:Y-m-d'],
            // Chặn khoảng quá dài để một cú gọi không kéo cả năm lịch về.
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from', 'before_or_equal:'.$this->maxTo()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'to.before_or_equal' => 'Chỉ xem được tối đa 62 ngày mỗi lần.',
        ];
    }

    private function maxTo(): string
    {
        $from = $this->query('from');

        if (! is_string($from) || $from === '') {
            return '2100-01-01';
        }

        return date('Y-m-d', strtotime($from.' +62 days'));
    }
}
