<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BadgeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'icon' => $this->icon,
            'iconUrl' => $this->publicUrl($this->icon),
            'description' => $this->description,
            'isSystem' => $this->is_system,
            'earnedAt' => $this->whenPivotLoaded('user_badges', fn () => $this->pivot->earned_at),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
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
