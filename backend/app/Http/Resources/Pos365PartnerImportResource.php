<?php

namespace App\Http\Resources;

use App\Enums\Pos365PartnerImportStatusEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class Pos365PartnerImportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Pos365PartnerImportStatusEnum $status */
        $status = $this->status;

        return [
            'id' => $this->id,
            'pos365PartnerId' => $this->pos365_partner_id,
            'pos365Code' => $this->pos365_code,
            'name' => $this->name,
            'phone' => $this->phone,
            'status' => $status->value,
            'statusLabel' => $status->label(),
            'needsAttention' => $status->needsAttention(),
            'note' => $this->note,
            'user' => $this->whenLoaded('user', fn () => $this->user === null ? null : [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'phone' => $this->user->phone,
            ]),
            'processedAt' => $this->processed_at?->format('Y-m-d H:i'),
            'updatedAt' => $this->updated_at?->format('Y-m-d H:i'),
        ];
    }
}
