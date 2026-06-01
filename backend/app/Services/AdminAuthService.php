<?php

namespace App\Services;

use App\DTOs\LoginDTO;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthService
{
    public function login(LoginDTO $dto): array
    {
        $admin = Admin::query()
            ->where('email', $dto->email)
            ->first();

        if (! $admin || ! Hash::check($dto->password, $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return [
            'admin' => $admin,
            'token' => $admin->createToken('admin-api-token', ['admin'])->plainTextToken,
        ];
    }

    public function logout(Admin $admin): void
    {
        $admin->currentAccessToken()?->delete();
    }
}
