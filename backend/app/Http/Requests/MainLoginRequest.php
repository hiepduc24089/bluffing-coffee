<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MainLoginRequest extends FormRequest
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
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string'],
        ];
    }
}
