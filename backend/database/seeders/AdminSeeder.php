<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

/**
 * Chạy được cả trên image production (composer --no-dev) nên không dùng factory,
 * vì factory phụ thuộc fakerphp chỉ có ở môi trường dev.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
<<<<<<< Updated upstream
        Admin::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@bluffing.coffee',
            'is_super_admin' => true,
        ]);
=======
        Admin::query()->firstOrCreate(
            ['email' => 'admin@bluffing.coffee'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'is_super_admin' => true,
            ],
        );
>>>>>>> Stashed changes
    }
}
