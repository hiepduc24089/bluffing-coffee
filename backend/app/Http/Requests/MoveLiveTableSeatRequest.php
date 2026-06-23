<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MoveLiveTableSeatRequest extends FormRequest
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
            'tournamentId' => ['required', 'string', 'exists:tournaments,id'],
            'tournamentRegistrationId' => ['required', 'integer', 'exists:tournament_registrations,id'],
            'toSeatNumber' => ['required', 'integer', 'min:1', 'max:9'],
        ];
    }
}
