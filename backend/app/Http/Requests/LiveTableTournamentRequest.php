<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LiveTableTournamentRequest extends FormRequest
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
            'tournament_id' => ['nullable', 'string', 'exists:tournaments,id'],
            'tournamentId' => ['nullable', 'string', 'exists:tournaments,id'],
        ];
    }

    public function tournamentId(): ?string
    {
        return $this->validated('tournamentId') ?? $this->validated('tournament_id');
    }
}
