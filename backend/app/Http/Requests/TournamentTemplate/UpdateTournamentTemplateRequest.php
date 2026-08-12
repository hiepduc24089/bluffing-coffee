<?php

namespace App\Http\Requests\TournamentTemplate;

use Illuminate\Validation\Rule;

class UpdateTournamentTemplateRequest extends StoreTournamentTemplateRequest
{
    protected function codeUniqueRule(): object
    {
        return Rule::unique('tournament_templates', 'code')
            ->ignore($this->route('tournament_template')?->id);
    }
}
