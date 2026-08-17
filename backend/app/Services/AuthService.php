<?php

namespace App\Services;

use App\DTOs\PhoneLoginDTO;
use App\Enums\UserRoleEnum;
use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
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

        // Tài khoản vỏ kéo từ POS365 về chưa có mật khẩu. Báo "sai mật khẩu" ở
        // đây vừa sai vừa bế tắc: người chơi có tài khoản thật, có BP thật,
        // nhưng không có mật khẩu nào để mà nhập đúng.
        if ($user && ! $user->isClaimed()) {
            throw ValidationException::withMessages([
                'phone' => ['Tài khoản chưa được kích hoạt. Vui lòng nhận tài khoản bằng số điện thoại.'],
            ]);
        }

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['Số điện thoại hoặc mật khẩu không đúng.'],
            ]);
        }

        $token = $user->createToken($tokenName, [$role->value])->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
