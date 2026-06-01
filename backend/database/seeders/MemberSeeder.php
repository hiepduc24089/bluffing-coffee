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
            'email' => 'member@bluffing.coffee',
            'role' => UserRoleEnum::Member,
        ]);
    }
}
