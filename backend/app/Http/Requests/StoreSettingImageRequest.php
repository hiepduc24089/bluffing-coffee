<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSettingImageRequest extends FormRequest
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
            'image' => ['required', 'image', 'max:5120'],
            'directory' => ['required', 'string', Rule::in([
                'settings/posts',
                'settings/events',
                'settings/banners',
                'settings/content',
                'badges',
            ])],
        ];
    }
}
