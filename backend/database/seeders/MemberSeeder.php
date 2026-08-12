<?php

namespace Database\Seeders;

use App\Enums\UserRoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Chạy được cả trên image production (composer --no-dev) nên không dùng factory,
 * vì factory phụ thuộc fakerphp chỉ có ở môi trường dev.
 */
class MemberSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['phone' => '0900000001'],
            [
                'name' => 'Member User',
                'role' => UserRoleEnum::Member,
                'password' => 'password',
            ],
        );
    }
}
