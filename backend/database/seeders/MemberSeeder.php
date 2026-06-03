<?php

namespace Database\Seeders;

use App\Enums\UserRoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Member User',
            'phone' => '0900000001',
            'role' => UserRoleEnum::Member,
        ]);
    }
}
