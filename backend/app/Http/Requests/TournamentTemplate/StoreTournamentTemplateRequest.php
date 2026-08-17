<?php

namespace App\Http\Requests\TournamentTemplate;

use App\Enums\TournamentTypeEnum;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTournamentTemplateRequest extends FormRequest
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
            'rebuyStack' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'defaultPriceWithDrink' => ['required', 'integer', 'min:0'],
            'defaultPriceWithoutDrink' => ['required', 'integer', 'min:0'],
            'levels' => ['required', 'array', 'min:1', 'max:60'],
            'levels.*.isBreak' => ['sometimes', 'boolean'],
            'levels.*.levelNumber' => ['nullable', 'integer', 'min:1'],
            'levels.*.smallBlind' => ['nullable', 'integer', 'min:0'],
            'levels.*.bigBlind' => ['nullable', 'integer', 'min:0'],
            'levels.*.ante' => ['nullable', 'integer', 'min:0'],
            'levels.*.durationMinutes' => ['required', 'integer', 'min:1', 'max:600'],
            'levels.*.note' => ['nullable', 'string', 'max:255'],
            'rewards' => ['required', 'array', 'min:1', 'max:50'],
            'rewards.*.position' => ['required', 'integer', 'min:1'],
            'rewards.*.bpReward' => ['required', 'integer', 'min:0'],
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
            $this->validateUniqueRewardPositions($validator);
        });
    }

    protected function codeUniqueRule(): object
    {
        return Rule::unique('tournament_templates', 'code');
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

    /**
     * Bảng thưởng có unique(position) dưới DB, nên chặn sớm ở tầng validate để trả về
     * lỗi đọc được thay vì lỗi ràng buộc khoá.
     */
    private function validateUniqueRewardPositions(Validator $validator): void
    {
        $positions = collect((array) $this->input('rewards', []))
            ->pluck('position')
            ->filter(fn ($position) => $position !== null)
            ->map(fn ($position) => (int) $position);

        if ($positions->duplicates()->isNotEmpty()) {
            $validator->errors()->add('rewards', 'Mỗi hạng chỉ được cấu hình BP thưởng một lần.');
        }
    }
}
