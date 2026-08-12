<?php

namespace App\Http\Requests;

use App\Enums\TournamentTypeEnum;
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
            'tournamentType' => ['sometimes', 'string', Rule::in(TournamentTypeEnum::values())],
            'tournamentTemplateId' => ['nullable', 'integer', 'exists:tournament_templates,id'],
            'buyIn' => ['sometimes', 'integer', 'min:0'],
            'ticketPriceWithDrink' => ['required', 'integer', 'min:0'],
            'ticketPriceWithoutDrink' => ['required', 'integer', 'min:0'],
            'capacity' => ['required', 'integer', 'min:2'],
            'startAt' => ['required', 'date_format:Y-m-d H:i'],
        ];
    }
}
