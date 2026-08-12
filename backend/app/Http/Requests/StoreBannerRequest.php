<?php

namespace App\Http\Requests;

use App\Rules\PublicImagePath;
use Illuminate\Foundation\Http\FormRequest;

class StoreBannerRequest extends FormRequest
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
            'title' => ['nullable', 'string', 'max:255'],
            'image' => ['required', 'string', 'max:255', new PublicImagePath()],
            'linkUrl' => ['nullable', 'url:http,https', 'max:255'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
