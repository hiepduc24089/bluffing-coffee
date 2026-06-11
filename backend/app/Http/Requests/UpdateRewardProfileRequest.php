<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRewardProfileRequest extends FormRequest
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
        $rewardProfile = $this->route('reward_profile');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('reward_profiles', 'code')->ignore($rewardProfile?->id),
            ],
            'isActive' => ['sometimes', 'boolean'],
            'defaultPriceWithDrink' => ['required', 'integer', 'min:0'],
            'defaultPriceWithoutDrink' => ['required', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.position' => ['required', 'integer', 'min:1'],
            'items.*.bpReward' => ['required', 'integer', 'min:0'],
        ];
    }
}
