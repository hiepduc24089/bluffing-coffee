<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRewardProfileRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:100', 'unique:reward_profiles,code'],
            'isActive' => ['sometimes', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.position' => ['required', 'integer', 'min:1'],
            'items.*.bpReward' => ['required', 'integer', 'min:0'],
        ];
    }
}
