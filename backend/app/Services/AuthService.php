<?php

namespace App\Services;

use App\DTOs\PhoneLoginDTO;
use App\Enums\UserRoleEnum;
use App\Models\User;
use App\Services\MemberPresenceService;
use App\Support\PhoneNumber;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly MemberPresenceService $presence,
    ) {}

    public function login(PhoneLoginDTO $dto, UserRoleEnum $role, string $tokenName): array
    {
        // Số điện thoại vào hệ thống từ nhiều đường — thành viên tự khai, admin
        // nhập tay, thu ngân gõ ở POS365 — nên định dạng không bao giờ đồng
        // nhất. So khớp thêm ở bản chuẩn hoá để người chơi gõ kiểu nào cũng vào
        // được, nhưng khớp đúng nguyên văn vẫn được ưu tiên trước.
        $normalized = PhoneNumber::normalize($dto->phone);

        $user = User::query()
            ->where('role', $role->value)
            ->where(function (Builder $query) use ($dto, $normalized) {
                $query->where('phone', $dto->phone);

                if ($normalized !== null) {
                    $query->orWhere('phone_e164', $normalized);
                }
            })
            ->orderByRaw('CASE WHEN phone = ? THEN 0 ELSE 1 END', [$dto->phone])
            ->first();

        // Tài khoản không có mật khẩu thì báo "sai mật khẩu" vừa sai vừa bế
        // tắc: người chơi có tài khoản thật, có BP thật, nhưng không có mật
        // khẩu nào để mà nhập đúng. Không còn tài khoản nào như vậy sau khi
        // migration cấp mật khẩu mặc định, nhưng chốt chặn thì vẫn phải có.
        if ($user && ! $user->hasPassword()) {
            throw ValidationException::withMessages([
                'phone' => ['Tài khoản chưa có mật khẩu. Vui lòng liên hệ quầy để được cấp lại.'],
            ]);
        }

        if (! $user || ! $this->passwordMatches($user, $dto->password)) {
            throw ValidationException::withMessages([
                'phone' => ['Số điện thoại hoặc mật khẩu không đúng.'],
            ]);
        }

        // Lần đăng nhập đầu tiên là mốc người chơi thực sự cầm lấy tài khoản.
        // Từ đây hồ sơ là của họ, một lần thu ngân sửa tên ở POS365 không được
        // ghi đè nữa — xem `PartnerLinkService::refreshShellProfile()`.
        if (! $user->isClaimed()) {
            $user->forceFill(['claimed_at' => now()])->save();
        }

        $this->presence->markSeen($user);

        $token = $user->createToken($tokenName, [$role->value])->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Mật khẩu mặc định của thành viên chính là số điện thoại của họ, mà số
     * điện thoại thì mỗi người gõ một kiểu: "0912 345 678", "+84912345678",
     * "84912345678" đều là thứ người chơi tin là mật khẩu của mình.
     *
     * Nên ngoài chuỗi gõ nguyên văn, thử thêm đúng một biến thể: dạng nội địa
     * đã chuẩn hoá. Chuỗi không phải số điện thoại thì `toLocal()` trả null và
     * nhánh này không chạy — mật khẩu người chơi tự đặt vẫn khớp chính xác.
     */
    private function passwordMatches(User $user, string $password): bool
    {
        if (Hash::check($password, $user->password)) {
            return true;
        }

        $asLocalPhone = PhoneNumber::toLocal($password);

        return $asLocalPhone !== null
            && $asLocalPhone !== $password
            && Hash::check($asLocalPhone, $user->password);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
