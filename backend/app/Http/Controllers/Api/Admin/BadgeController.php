<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Badge\BadgeIndexRequest;
use App\Http\Requests\Badge\StoreBadgeRequest;
use App\Http\Requests\Badge\UpdateBadgeRequest;
use App\Http\Resources\BadgeResource;
use App\Models\Badge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class BadgeController extends Controller
{
    public function index(BadgeIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $search = $validated['search'] ?? null;

        $badges = Badge::query()
            ->when($search, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate((int) ($validated['per_page'] ?? 10));

        return BadgeResource::collection($badges);
    }

    public function store(StoreBadgeRequest $request): BadgeResource
    {
        $badge = Badge::query()->create($request->validated());

        return BadgeResource::make($badge);
    }

    public function update(UpdateBadgeRequest $request, Badge $badge): BadgeResource
    {
        $badge->update($request->validated());

        return BadgeResource::make($badge);
    }

    public function destroy(Badge $badge): JsonResponse
    {
        $badge->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
