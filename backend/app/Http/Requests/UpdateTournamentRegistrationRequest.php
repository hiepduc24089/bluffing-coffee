<?php

namespace App\Http\Requests;

use App\Enums\TournamentRegistrationStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTournamentRegistrationRequest extends FormRequest
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
            'status' => ['sometimes', 'string', Rule::in(TournamentRegistrationStatusEnum::values())],
            'finalPosition' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
