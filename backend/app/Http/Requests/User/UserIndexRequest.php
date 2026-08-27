<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UserIndexRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            // `recent` cho ô chọn người chơi ở quầy, `latest` cho màn quản lý
            // thành viên. Mặc định giữ nguyên `latest` để màn cũ không đổi.
            'sort' => ['nullable', 'string', 'in:latest,recent'],
        ];
    }
}
