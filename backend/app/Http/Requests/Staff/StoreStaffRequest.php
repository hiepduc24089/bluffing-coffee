<?php

namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', $this->emailUniqueRule()],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }

    protected function emailUniqueRule(): object
    {
        return Rule::unique('admins', 'email');
    }
}
