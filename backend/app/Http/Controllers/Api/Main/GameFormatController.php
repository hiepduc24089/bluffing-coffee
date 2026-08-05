<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Http\Resources\GameFormatResource;
use App\Models\GameFormat;
use App\Services\GameFormatService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Public read access used by the tournament clock screen, which runs on venue
 * TVs that cannot realistically hold an admin session.
 */
class GameFormatController extends Controller
{
    public function __construct(
        private readonly GameFormatService $gameFormatService,
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        return GameFormatResource::collection($this->gameFormatService->activeFormats());
    }

    public function show(string $code): GameFormatResource
    {
        $gameFormat = GameFormat::query()
            ->with('levels')
            ->where('code', $code)
            ->where('is_active', true)
            ->firstOrFail();

        return GameFormatResource::make($gameFormat);
    }
}
