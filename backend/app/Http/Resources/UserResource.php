<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'bpBalance' => $this->bp_balance,
            'rankLevel' => $this->rank_level,
            // Tài khoản vỏ kéo từ POS365 về chưa có mật khẩu, chưa ai đăng nhập
            // được. Nhìn từ màn Thành viên nó giống hệt thành viên tạo tay, nên
            // phải nói ra — nếu không chủ quán không biết ai đã nhận tài khoản.
            'isClaimed' => $this->isClaimed(),
            'claimedAt' => $this->claimed_at?->format('Y-m-d H:i'),
            'lastSeenAt' => $this->last_seen_at?->format('Y-m-d H:i'),
            'fromPos365' => $this->whenCounted('pos365Partners', fn () => $this->pos365_partners_count > 0),
            'statistic' => $this->whenLoaded('statistic', fn () => UserStatisticResource::make($this->statistic)),
            'badges' => BadgeResource::collection($this->whenLoaded('badges')),
            'createdAt' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
