<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Http\Resources\TournamentTemplateResource;
use App\Models\TournamentTemplate;
use App\Services\TournamentTemplateService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Public read access used by the tournament clock screen, which runs on venue
 * TVs that cannot realistically hold an admin session.
 */
class TournamentTemplateController extends Controller
{
    public function __construct(
        private readonly TournamentTemplateService $tournamentTemplateService,
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        return TournamentTemplateResource::collection(
            $this->tournamentTemplateService->allTemplates(),
        );
    }

    public function show(string $code): TournamentTemplateResource
    {
        $template = TournamentTemplate::query()
            ->with('levels')
            ->where('code', $code)
            ->firstOrFail();

        return TournamentTemplateResource::make($template);
    }
}
