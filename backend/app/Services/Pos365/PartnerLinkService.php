<?php

namespace App\Services\Pos365;

use App\DTOs\Pos365\Pos365PartnerDTO;
use App\Enums\Pos365PartnerImportStatusEnum;
use App\Enums\UserRoleEnum;
use App\Models\Pos365PartnerImport;
use App\Models\User;
use App\Models\UserPos365Partner;
use App\Repositories\Pos365PartnerImportRepository;
use App\Support\PhoneNumber;
use Illuminate\Support\Facades\DB;

/**
 * Biến một khách hàng POS365 thành một thành viên Bluffing.
 *
 * POS365 là nguồn sự thật về danh tính hội viên: khách được tạo ở quầy, bên
 * mình kéo về. Tài khoản tạo ra ở đây là "vỏ" — có tên, có số điện thoại, tích
 * được BP, nhưng chưa có mật khẩu. Người chơi nhận nó sau bằng số điện thoại +
 * OTP, và nhận được luôn phần BP đã tích trước đó.
 */
class PartnerLinkService
{
    public function __construct(
        private readonly Pos365PartnerImportRepository $imports,
    ) {}

    /**
     * Trả về trạng thái đã chốt cho bản ghi import này.
     */
    public function link(Pos365PartnerDTO $partner, Pos365PartnerImport $import): Pos365PartnerImportStatusEnum
    {
        $existing = $this->imports->findLink($partner->id);

        // Đã từng gắn và liên kết vẫn còn đúng: chỉ làm tươi thông tin.
        if ($existing !== null && $this->linkStillHolds($existing, $partner)) {
            $this->imports->touchLink($existing, $partner->code);

            // CHỈ bản ghi chính mới được sửa hồ sơ người dùng. Bản trùng do
            // quầy tạo lại mà sửa được hồ sơ thì nó sẽ chiếm chỗ của người
            // gốc, và người gốc biến mất khỏi danh sách thành viên.
            if ($existing->is_primary) {
                $this->refreshShellProfile($existing->user, $partner);
            }

            // Suy từ chính liên kết chứ không đọc trạng thái cũ của bản ghi
            // import: mỗi lượt sync đã ghi đè trạng thái đó về `pending`.
            $status = $existing->is_primary
                ? Pos365PartnerImportStatusEnum::Imported
                : Pos365PartnerImportStatusEnum::Linked;

            $this->imports->markProcessed($import, $status, $existing->user);

            return $status;
        }

        // Thu ngân không nhập số điện thoại thì không có cách nào biết là ai.
        // Đã xác nhận trên API thật: POS365 không ép nhập được, nên nhánh này
        // là hàng đợi việc tay thường trực chứ không phải trường hợp hiếm.
        if (! $partner->hasUsablePhone()) {
            if ($existing !== null) {
                $this->imports->deleteLink($existing);
            }

            $this->imports->markProcessed(
                $import,
                Pos365PartnerImportStatusEnum::MissingPhone,
                null,
                'POS365 không có số điện thoại cho khách này.',
            );

            return Pos365PartnerImportStatusEnum::MissingPhone;
        }

        return DB::transaction(function () use ($partner, $import, $existing) {
            // Liên kết cũ đã hết hiệu lực (quầy sửa số điện thoại sang số
            // khác): gỡ ra rồi khớp lại từ đầu như một khách chưa từng thấy.
            if ($existing !== null) {
                $this->imports->deleteLink($existing);
            }

            $user = $this->imports->lockUserByPhoneE164($partner->phoneE164)
                ?? ($partner->phone !== null ? $this->imports->lockUserByRawPhone($partner->phone) : null);

            if ($user !== null) {
                // Số trùng thành viên đã có. POS365 cho phép hai khách khác
                // nhau cùng một số (đã thử thật), nên đây là bản trùng do quầy
                // tạo lại chứ không phải người mới. Gắn thêm partner vào cùng
                // một người để đơn của cả hai đều tính BP về đúng chỗ.
                $isPrimary = ! $this->imports->userHasPrimaryLink($user);

                $this->imports->createLink($user, $partner->id, $partner->code, $isPrimary);

                // Chỉ bản ghi chính mới được sửa hồ sơ. Bản trùng thường là do
                // thu ngân gõ vội ("Tran V. Binh") — để nó ghi đè lên bản ghi
                // đầy đủ là đi lùi.
                if ($isPrimary) {
                    $this->refreshShellProfile($user, $partner);
                }

                $this->imports->markProcessed(
                    $import,
                    Pos365PartnerImportStatusEnum::Linked,
                    $user,
                    'Số điện thoại trùng thành viên đã có.',
                );

                return Pos365PartnerImportStatusEnum::Linked;
            }

            $user = $this->createShellUser($partner);

            $this->imports->createLink($user, $partner->id, $partner->code, isPrimary: true);

            $this->imports->markProcessed($import, Pos365PartnerImportStatusEnum::Imported, $user);

            return Pos365PartnerImportStatusEnum::Imported;
        });
    }

    /**
     * Liên kết cũ có còn đúng không.
     *
     * Bản ghi chính thì luôn còn: nó chính là danh tính của thành viên, quầy
     * sửa gì thì thành viên đi theo. Nhưng bản trùng thì khác — thu ngân tạo
     * nhầm rồi sửa lại số điện thoại nghĩa là **nó không còn là người đó nữa**,
     * và phải được tách ra thành người riêng.
     */
    private function linkStillHolds(UserPos365Partner $link, Pos365PartnerDTO $partner): bool
    {
        if ($link->is_primary) {
            return true;
        }

        return $partner->phoneE164 !== null
            && $partner->phoneE164 === $link->user?->phone_e164;
    }

    /**
     * Admin tự chọn thành viên cho một khách POS365 không đoán được là ai —
     * lối thoát cho nhánh `missing_phone`.
     */
    public function linkManually(Pos365PartnerImport $import, User $user): Pos365PartnerImport
    {
        return DB::transaction(function () use ($import, $user) {
            $existing = $this->imports->findLink($import->pos365_partner_id);

            if ($existing !== null) {
                $this->imports->touchLink($existing, $import->pos365_code);
            } else {
                $this->imports->createLink(
                    $user,
                    $import->pos365_partner_id,
                    $import->pos365_code,
                    isPrimary: ! $this->imports->userHasPrimaryLink($user),
                );
            }

            return $this->imports->markProcessed(
                $import,
                Pos365PartnerImportStatusEnum::Linked,
                $user,
                'Gắn tay từ màn đối soát.',
            );
        });
    }

    public function ignore(Pos365PartnerImport $import, ?string $note = null): Pos365PartnerImport
    {
        return $this->imports->markProcessed(
            $import,
            Pos365PartnerImportStatusEnum::Ignored,
            null,
            $note ?? 'Admin bỏ qua.',
        );
    }

    private function createShellUser(Pos365PartnerDTO $partner): User
    {
        return User::query()->create([
            'name' => $partner->displayName(),
            // Dạng nội địa đã chuẩn hoá, không phải chuỗi thô thu ngân gõ:
            // cột này vừa là số điện thoại vừa là tên đăng nhập.
            'phone' => PhoneNumber::toLocal($partner->phone) ?? $partner->phone,
            'role' => UserRoleEnum::Member,
            // Chưa ai đăng nhập vào tài khoản này. `claimed_at` để null là tín
            // hiệu duy nhất phân biệt tài khoản vỏ với thành viên thật.
            'password' => null,
        ]);
    }

    /**
     * Đồng bộ tên và số điện thoại — nhưng CHỈ với tài khoản vỏ.
     *
     * Khi người chơi đã nhận tài khoản thì hồ sơ là của họ: tên hiển thị họ tự
     * đặt không được để một lần sửa ở quầy ghi đè. POS365 làm chủ danh tính lúc
     * tạo, không làm chủ vĩnh viễn.
     */
    private function refreshShellProfile(?User $user, Pos365PartnerDTO $partner): void
    {
        if ($user === null || $user->isClaimed()) {
            return;
        }

        $attributes = [];

        if ($partner->name !== null && $partner->name !== $user->name) {
            $attributes['name'] = $partner->name;
        }

        // Đổi số điện thoại chỉ an toàn khi chưa ai khác giữ số đó — `phone` là
        // unique và cũng là tên đăng nhập.
        $phone = PhoneNumber::toLocal($partner->phone);

        if ($phone !== null && $phone !== $user->phone) {
            $taken = User::query()
                ->where('phone', $phone)
                ->whereKeyNot($user->getKey())
                ->exists();

            if (! $taken) {
                $attributes['phone'] = $phone;
            }
        }

        if ($attributes !== []) {
            $user->update($attributes);
        }
    }
}
