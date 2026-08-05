<?php

namespace App\Http\Requests\GameFormat;

use App\Enums\TournamentTypeEnum;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameFormatRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:100', $this->codeUniqueRule()],
            'tournamentType' => ['required', 'string', Rule::in(TournamentTypeEnum::values())],
            'startingStack' => ['required', 'integer', 'min:1'],
            'lateRegUntilLevel' => ['nullable', 'integer', 'min:1'],
            'maxRebuy' => ['nullable', 'integer', 'min:0'],
            'rebuyStack' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'isActive' => ['sometimes', 'boolean'],
            'levels' => ['required', 'array', 'min:1', 'max:60'],
            'levels.*.isBreak' => ['sometimes', 'boolean'],
            'levels.*.levelNumber' => ['nullable', 'integer', 'min:1'],
            'levels.*.smallBlind' => ['nullable', 'integer', 'min:0'],
            'levels.*.bigBlind' => ['nullable', 'integer', 'min:0'],
            'levels.*.ante' => ['nullable', 'integer', 'min:0'],
            'levels.*.durationMinutes' => ['required', 'integer', 'min:1', 'max:600'],
            'levels.*.note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ((array) $this->input('levels', []) as $index => $level) {
                if (filter_var($level['isBreak'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    continue;
                }

                $smallBlind = (int) ($level['smallBlind'] ?? 0);
                $bigBlind = (int) ($level['bigBlind'] ?? 0);

                if ($smallBlind < 1) {
                    $validator->errors()->add("levels.{$index}.smallBlind", 'Small blind phải lớn hơn 0.');
                }

                if ($bigBlind < $smallBlind) {
                    $validator->errors()->add("levels.{$index}.bigBlind", 'Big blind phải lớn hơn hoặc bằng small blind.');
                }
            }

            $this->validateLateRegLevel($validator);
        });
    }

    protected function codeUniqueRule(): object
    {
        return Rule::unique('game_formats', 'code');
    }

    private function validateLateRegLevel(Validator $validator): void
    {
        $lateRegUntilLevel = $this->input('lateRegUntilLevel');

        if ($lateRegUntilLevel === null) {
            return;
        }

        $highestLevelNumber = collect((array) $this->input('levels', []))
            ->reject(fn (array $level) => filter_var($level['isBreak'] ?? false, FILTER_VALIDATE_BOOLEAN))
            ->max('levelNumber');

        if ($highestLevelNumber !== null && (int) $lateRegUntilLevel > (int) $highestLevelNumber) {
            $validator->errors()->add(
                'lateRegUntilLevel',
                'Level chốt late reg/rebuy không được vượt quá level cuối cùng của cấu trúc.',
            );
        }
    }
}
