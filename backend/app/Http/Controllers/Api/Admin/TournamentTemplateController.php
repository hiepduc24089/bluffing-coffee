<?php

namespace App\Http\Controllers\Api\Admin;

use App\DTOs\TournamentTemplateDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\TournamentTemplate\StoreTournamentTemplateRequest;
use App\Http\Requests\TournamentTemplate\TournamentTemplateIndexRequest;
use App\Http\Requests\TournamentTemplate\UpdateTournamentTemplateRequest;
use App\Http\Resources\TournamentTemplateResource;
use App\Models\TournamentTemplate;
use App\Services\TournamentTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TournamentTemplateController extends Controller
{
    public function __construct(
        private readonly TournamentTemplateService $tournamentTemplateService,
    ) {
    }

    public function index(TournamentTemplateIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $templates = $this->tournamentTemplateService->paginate(
            search: $validated['search'] ?? null,
            tournamentType: $validated['tournament_type'] ?? null,
            perPage: (int) ($validated['per_page'] ?? 10),
        );

        return TournamentTemplateResource::collection($templates);
    }

    public function store(StoreTournamentTemplateRequest $request): TournamentTemplateResource
    {
        $template = $this->tournamentTemplateService->create(
            TournamentTemplateDTO::fromArray($request->validated()),
        );

        return TournamentTemplateResource::make($template);
    }

    public function show(TournamentTemplate $tournamentTemplate): TournamentTemplateResource
    {
        return TournamentTemplateResource::make($tournamentTemplate->load(['levels', 'rewards']));
    }

    public function update(
        UpdateTournamentTemplateRequest $request,
        TournamentTemplate $tournamentTemplate,
    ): TournamentTemplateResource {
        $template = $this->tournamentTemplateService->update(
            $tournamentTemplate,
            TournamentTemplateDTO::fromArray($request->validated()),
        );

        return TournamentTemplateResource::make($template);
    }

    public function duplicate(TournamentTemplate $tournamentTemplate): TournamentTemplateResource
    {
        return TournamentTemplateResource::make(
            $this->tournamentTemplateService->duplicate($tournamentTemplate),
        );
    }

    public function destroy(TournamentTemplate $tournamentTemplate): JsonResponse
    {
        $this->tournamentTemplateService->delete($tournamentTemplate);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
