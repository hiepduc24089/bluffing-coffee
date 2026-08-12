<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BannerIndexRequest;
use App\Http\Requests\StoreBannerRequest;
use App\Http\Requests\UpdateBannerRequest;
use App\Http\Resources\BannerResource;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class BannerController extends Controller
{
    public function index(BannerIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $search = $validated['search'] ?? null;

        $banners = Banner::query()
            ->when($search, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('link_url', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->latest()
            ->paginate((int) ($validated['per_page'] ?? 10));

        return BannerResource::collection($banners);
    }

    public function store(StoreBannerRequest $request): BannerResource
    {
        $validated = $request->validated();

        $banner = Banner::query()->create([
            'title' => $validated['title'] ?? null,
            'image' => $validated['image'],
            'link_url' => $validated['linkUrl'] ?? null,
            'sort_order' => $validated['sortOrder'] ?? 0,
        ]);

        return BannerResource::make($banner);
    }

    public function update(UpdateBannerRequest $request, Banner $banner): BannerResource
    {
        $validated = $request->validated();

        $banner->update([
            'title' => $validated['title'] ?? null,
            'image' => $validated['image'],
            'link_url' => $validated['linkUrl'] ?? null,
            'sort_order' => $validated['sortOrder'] ?? 0,
        ]);

        return BannerResource::make($banner);
    }

    public function destroy(Banner $banner): JsonResponse
    {
        $banner->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
