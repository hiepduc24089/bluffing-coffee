<?php

namespace App\Http\Requests;

use App\Enums\TournamentStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTournamentRequest extends FormRequest
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
            'buyIn' => ['required', 'integer', 'min:0'],
            'capacity' => ['required', 'integer', 'min:2'],
            'status' => ['required', 'string', Rule::in(TournamentStatusEnum::values())],
            'startAt' => ['required', 'date_format:Y-m-d H:i'],
        ];
    }
}
