<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EliminateLiveTableSeatRequest extends FormRequest
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
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
