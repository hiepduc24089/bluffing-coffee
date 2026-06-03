<?php

namespace App\Services;

use App\DTOs\PhoneLoginDTO;
use App\Enums\UserRoleEnum;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(PhoneLoginDTO $dto, UserRoleEnum $role, string $tokenName): array
    {
        $user = User::query()
            ->where('phone', $dto->phone)
            ->where('role', $role->value)
            ->first();

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['The provided credentials are incorrect.'],
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
