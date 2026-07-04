<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContentPageRequest extends FormRequest
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
            'type' => ['required', 'string', Rule::in(['post', 'event'])],
            'title' => ['required', 'string', 'max:255'],
            'coverImage' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'isPublished' => ['nullable', 'boolean'],
        ];
    }
}
