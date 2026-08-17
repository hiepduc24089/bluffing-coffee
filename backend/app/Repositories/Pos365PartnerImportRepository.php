<?php

namespace App\Repositories;

use App\Enums\Pos365PartnerImportStatusEnum;
use App\Models\Pos365PartnerImport;
use App\Models\User;
use App\Models\UserPos365Partner;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class Pos365PartnerImportRepository
{
    public function paginate(?string $status, ?string $search, int $perPage): LengthAwarePaginator
    {
        return Pos365PartnerImport::query()
            ->with('user:id,name,phone')
            ->when($status, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($search, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('pos365_code', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('updated_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @return array<string, int>
     */
    public function countsByStatus(): array
    {
        return Pos365PartnerImport::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();
    }

    public function findByPartnerId(int $partnerId): ?Pos365PartnerImport
    {
        return Pos365PartnerImport::query()
            ->where('pos365_partner_id', $partnerId)
            ->first();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsertByPartnerId(int $partnerId, array $attributes): Pos365PartnerImport
    {
        return Pos365PartnerImport::query()->updateOrCreate(
            ['pos365_partner_id' => $partnerId],
            $attributes,
        );
    }

    public function findLink(int $partnerId): ?UserPos365Partner
    {
        return UserPos365Partner::query()
            ->where('pos365_partner_id', $partnerId)
            ->first();
    }

    /**
     * Khoá dòng khi tra theo số điện thoại: hai partner cùng số về trong cùng
     * một lô sẽ chạy sát nhau, không khoá thì cả hai cùng thấy "chưa có user"
     * và cùng tạo, đẻ ra đúng cái trùng lặp ta đang tránh.
     */
    public function lockUserByPhoneE164(string $phoneE164): ?User
    {
        return User::query()
            ->where('phone_e164', $phoneE164)
            ->lockForUpdate()
            ->first();
    }

    /**
     * Lưới hứng cho thành viên cũ có `phone` ở dạng không chuẩn hoá được (gõ
     * thiếu số, lẫn ký tự). Họ không có `phone_e164` nên tra ở trên trượt, mà
     * `users.phone` lại unique — không kiểm ở đây thì lệnh tạo sẽ vỡ.
     */
    public function lockUserByRawPhone(string $phone): ?User
    {
        return User::query()
            ->where('phone', $phone)
            ->lockForUpdate()
            ->first();
    }

    public function createLink(User $user, int $partnerId, ?string $code, bool $isPrimary): UserPos365Partner
    {
        return UserPos365Partner::query()->create([
            'user_id' => $user->getKey(),
            'pos365_partner_id' => $partnerId,
            'pos365_code' => $code,
            'is_primary' => $isPrimary,
            'last_synced_at' => now(),
        ]);
    }

    public function deleteLink(UserPos365Partner $link): void
    {
        $link->delete();
    }

    public function touchLink(UserPos365Partner $link, ?string $code): void
    {
        $link->update([
            'pos365_code' => $code ?? $link->pos365_code,
            'last_synced_at' => now(),
        ]);
    }

    public function userHasPrimaryLink(User $user): bool
    {
        return $user->pos365Partners()->where('is_primary', true)->exists();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function markProcessed(
        Pos365PartnerImport $import,
        Pos365PartnerImportStatusEnum $status,
        ?User $user = null,
        ?string $note = null,
    ): Pos365PartnerImport {
        $import->update([
            'status' => $status,
            'user_id' => $user?->getKey() ?? $import->user_id,
            'note' => $note,
            'processed_at' => now(),
        ]);

        return $import;
    }
}
