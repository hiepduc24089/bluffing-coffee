<?php

namespace App\Http\Requests;

use App\Enums\LiveTableSeatingStrategyEnum;
use App\Services\LiveTableService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MergeLiveTablesRequest extends FormRequest
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
        $tableKeys = array_keys(LiveTableService::TABLES);

        return [
            'tournamentId' => ['required', 'string', 'exists:tournaments,id'],
            'sourceTableKeys' => ['required', 'array', 'min:1'],
            'sourceTableKeys.*' => [
                'required',
                'string',
                Rule::in($tableKeys),
                Rule::notIn([$this->route('tableKey')]),
            ],
            'seatingStrategy' => ['nullable', Rule::enum(LiveTableSeatingStrategyEnum::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sourceTableKeys.required' => 'Chọn ít nhất một bàn nguồn để gom.',
            'sourceTableKeys.*.not_in' => 'Bàn nguồn không được trùng bàn đích.',
        ];
    }

    /**
     * @return array<int, string>
     */
    public function sourceTableKeys(): array
    {
        return array_values(array_unique($this->validated('sourceTableKeys')));
    }

    public function seatingStrategy(): LiveTableSeatingStrategyEnum
    {
        return LiveTableSeatingStrategyEnum::tryFrom((string) $this->validated('seatingStrategy'))
            ?? LiveTableSeatingStrategyEnum::Random;
    }
}
