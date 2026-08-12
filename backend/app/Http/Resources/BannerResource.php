<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BannerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'image' => $this->image,
            'imageUrl' => $this->publicUrl($this->image),
            'linkUrl' => $this->link_url,
            'sortOrder' => $this->sort_order,
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
            'updatedAt' => $this->updated_at?->format('Y-m-d H:i'),
        ];
    }

    private function publicUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'https://') || str_starts_with($path, '/storage/')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
