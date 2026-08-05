<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContentPageIndexRequest;
use App\Http\Requests\StoreContentPageRequest;
use App\Http\Requests\UpdateContentPageRequest;
use App\Http\Resources\ContentPageResource;
use App\Models\ContentPage;
use App\Support\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ContentPageController extends Controller
{
    public function index(ContentPageIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $search = $validated['search'] ?? null;

        $pages = ContentPage::query()
            ->where('type', $validated['type'])
            ->when($search, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate((int) ($validated['per_page'] ?? 10));

        return ContentPageResource::collection($pages);
    }

    public function store(StoreContentPageRequest $request): ContentPageResource
    {
        $validated = $request->validated();

        $page = ContentPage::query()->create([
            'type' => $validated['type'],
            'title' => $validated['title'],
            'cover_image' => $validated['coverImage'] ?? null,
            'content' => HtmlSanitizer::clean($validated['content'] ?? null),
            'is_published' => $validated['isPublished'] ?? true,
        ]);

        return ContentPageResource::make($page);
    }

    public function update(UpdateContentPageRequest $request, ContentPage $contentPage): ContentPageResource
    {
        $validated = $request->validated();

        $contentPage->update([
            'type' => $validated['type'],
            'title' => $validated['title'],
            'cover_image' => $validated['coverImage'] ?? null,
            'content' => HtmlSanitizer::clean($validated['content'] ?? null),
            'is_published' => $validated['isPublished'] ?? true,
        ]);

        return ContentPageResource::make($contentPage);
    }

    public function destroy(ContentPage $contentPage): JsonResponse
    {
        $contentPage->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
