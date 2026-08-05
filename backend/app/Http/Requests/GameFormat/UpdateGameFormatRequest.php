<?php

namespace App\Http\Requests\GameFormat;

use Illuminate\Validation\Rule;

class UpdateGameFormatRequest extends StoreGameFormatRequest
{
    protected function codeUniqueRule(): object
    {
        return Rule::unique('game_formats', 'code')->ignore($this->route('game_format')?->id);
    }
}
