<?php

namespace App\Http\Controllers\Api\Admin;

use App\DTOs\GameFormatDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\GameFormat\GameFormatIndexRequest;
use App\Http\Requests\GameFormat\StoreGameFormatRequest;
use App\Http\Requests\GameFormat\UpdateGameFormatRequest;
use App\Http\Resources\GameFormatResource;
use App\Models\GameFormat;
use App\Services\GameFormatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class GameFormatController extends Controller
{
    public function __construct(
        private readonly GameFormatService $gameFormatService,
    ) {
    }

    public function index(GameFormatIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $gameFormats = $this->gameFormatService->paginate(
            search: $validated['search'] ?? null,
            tournamentType: $validated['tournament_type'] ?? null,
            isActive: isset($validated['is_active']) ? $request->boolean('is_active') : null,
            perPage: (int) ($validated['per_page'] ?? 10),
        );

        return GameFormatResource::collection($gameFormats);
    }

    public function store(StoreGameFormatRequest $request): GameFormatResource
    {
        $gameFormat = $this->gameFormatService->create(
            GameFormatDTO::fromArray($request->validated()),
        );

        return GameFormatResource::make($gameFormat);
    }

    public function show(GameFormat $gameFormat): GameFormatResource
    {
        return GameFormatResource::make($gameFormat->load('levels'));
    }

    public function update(UpdateGameFormatRequest $request, GameFormat $gameFormat): GameFormatResource
    {
        $gameFormat = $this->gameFormatService->update(
            $gameFormat,
            GameFormatDTO::fromArray($request->validated()),
        );

        return GameFormatResource::make($gameFormat);
    }

    public function duplicate(GameFormat $gameFormat): GameFormatResource
    {
        return GameFormatResource::make($this->gameFormatService->duplicate($gameFormat));
    }

    public function destroy(GameFormat $gameFormat): JsonResponse
    {
        $this->gameFormatService->delete($gameFormat);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
