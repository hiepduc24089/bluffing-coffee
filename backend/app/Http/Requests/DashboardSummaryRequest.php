<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DashboardSummaryRequest extends FormRequest
{
    private const DEFAULT_ACTIVITY_LIMIT = 5;

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
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ];
    }

    public function activityLimit(): int
    {
        return (int) ($this->validated('limit') ?? self::DEFAULT_ACTIVITY_LIMIT);
    }
}
