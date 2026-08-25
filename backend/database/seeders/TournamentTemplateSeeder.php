<?php

namespace Database\Seeders;

use App\Enums\TournamentTypeEnum;
use App\Models\TournamentTemplate;
use Illuminate\Database\Seeder;

/**
 * Blind structures, giá vé và BP thưởng do quán chốt, khớp với dữ liệu đang chạy
 * trên production. Mỗi mẫu giải đấu tự giữ bảng thưởng riêng nên chủ quán chỉnh
 * trực tiếp trong màn Mẫu giải đấu; seeder chỉ dựng lại mốc khởi đầu.
 */
class TournamentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $formats = [
            [
                'code' => 'SIT_N_GO_CLASSIC',
                'name' => 'Sit & Go Classic',
                'tournament_type' => TournamentTypeEnum::SitNgo->value,
                'starting_stack' => 15000,
                'late_reg_until_level' => 2,
                'rebuy_stack' => null,
                'description' => 'Bắt đầu (Level 1) - Stack 15K (Play & Chill) | Late reg/Rebuy: Hết Level 2 hoặc đủ 10 người | Thời gian ước tính: 1.5 Giờ',
                'default_price_with_drink' => 85000,
                'default_price_without_drink' => 65000,
                'rewards' => [1 => 30, 2 => 20, 3 => 10],
                'levels' => [
                    ['position' => 1, 'level_number' => 1, 'small_blind' => 100, 'big_blind' => 200, 'ante' => 0, 'duration_minutes' => 10, 'is_break' => false, 'note' => 'Bắt đầu (Level 1) - Stack 15K (Play & Chill)'],
                    ['position' => 2, 'level_number' => 2, 'small_blind' => 200, 'big_blind' => 400, 'ante' => 0, 'duration_minutes' => 10, 'is_break' => false, 'note' => 'Mức Rebuy cuối cùng'],
                    ['position' => 3, 'level_number' => 3, 'small_blind' => 300, 'big_blind' => 600, 'ante' => 0, 'duration_minutes' => 10, 'is_break' => false, 'note' => 'Khóa Rebuy hoàn toàn'],
                    ['position' => 4, 'level_number' => 4, 'small_blind' => 400, 'big_blind' => 800, 'ante' => 0, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 5, 'level_number' => 5, 'small_blind' => 600, 'big_blind' => 1200, 'ante' => 1200, 'duration_minutes' => 10, 'is_break' => false, 'note' => 'Bắt đầu tính Ante'],
                    ['position' => 6, 'level_number' => 6, 'small_blind' => 1000, 'big_blind' => 2000, 'ante' => 2000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 7, 'level_number' => 7, 'small_blind' => 1500, 'big_blind' => 3000, 'ante' => 3000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 8, 'level_number' => 8, 'small_blind' => 2000, 'big_blind' => 4000, 'ante' => 4000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 9, 'level_number' => 9, 'small_blind' => 3000, 'big_blind' => 6000, 'ante' => 6000, 'duration_minutes' => 10, 'is_break' => false, 'note' => 'Kết thúc giải đấu nhanh bàn đơn'],
                ],
            ],
            [
                'code' => 'TURBO',
                'name' => 'Turbo',
                'tournament_type' => TournamentTypeEnum::Turbo->value,
                'starting_stack' => 22000,
                'late_reg_until_level' => 8,
                'rebuy_stack' => 22000,
                'description' => 'Bắt đầu (Level 2) - Stack 22K | Late reg/Rebuy: Hết Level 8 | Thời gian ước tính: 4 Giờ',
                'default_price_with_drink' => 125000,
                'default_price_without_drink' => 105000,
                'rewards' => [1 => 90, 2 => 60, 3 => 30],
                'levels' => [
                    ['position' => 1, 'level_number' => 1, 'small_blind' => 100, 'big_blind' => 200, 'ante' => 0, 'duration_minutes' => 16, 'is_break' => false, 'note' => 'Bắt đầu (Level 2) - Stack 22K'],
                    ['position' => 2, 'level_number' => 2, 'small_blind' => 200, 'big_blind' => 400, 'ante' => 0, 'duration_minutes' => 16, 'is_break' => false, 'note' => null],
                    ['position' => 3, 'level_number' => 3, 'small_blind' => 300, 'big_blind' => 600, 'ante' => 0, 'duration_minutes' => 16, 'is_break' => false, 'note' => null],
                    ['position' => 4, 'level_number' => 4, 'small_blind' => 400, 'big_blind' => 800, 'ante' => 0, 'duration_minutes' => 16, 'is_break' => false, 'note' => null],
                    ['position' => 5, 'level_number' => null, 'small_blind' => 0, 'big_blind' => 0, 'ante' => 0, 'duration_minutes' => 5, 'is_break' => true, 'note' => 'Nghỉ giải lao'],
                    ['position' => 6, 'level_number' => 5, 'small_blind' => 500, 'big_blind' => 1000, 'ante' => 1000, 'duration_minutes' => 16, 'is_break' => false, 'note' => 'Bắt đầu Ante'],
                    ['position' => 7, 'level_number' => 6, 'small_blind' => 600, 'big_blind' => 1200, 'ante' => 1200, 'duration_minutes' => 16, 'is_break' => false, 'note' => null],
                    ['position' => 8, 'level_number' => 7, 'small_blind' => 800, 'big_blind' => 1600, 'ante' => 1600, 'duration_minutes' => 16, 'is_break' => false, 'note' => null],
                    ['position' => 9, 'level_number' => 8, 'small_blind' => 1000, 'big_blind' => 2000, 'ante' => 2000, 'duration_minutes' => 16, 'is_break' => false, 'note' => 'Mức Rebuy cuối cùng'],
                    ['position' => 10, 'level_number' => 9, 'small_blind' => 1200, 'big_blind' => 2400, 'ante' => 2400, 'duration_minutes' => 12, 'is_break' => false, 'note' => 'Rút ngắn thời gian tăng blind'],
                    ['position' => 11, 'level_number' => null, 'small_blind' => 0, 'big_blind' => 0, 'ante' => 0, 'duration_minutes' => 8, 'is_break' => true, 'note' => 'Nghỉ giải lao'],
                    ['position' => 12, 'level_number' => 10, 'small_blind' => 1500, 'big_blind' => 3000, 'ante' => 3000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 13, 'level_number' => 11, 'small_blind' => 2000, 'big_blind' => 4000, 'ante' => 4000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 14, 'level_number' => 12, 'small_blind' => 3000, 'big_blind' => 6000, 'ante' => 6000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 15, 'level_number' => 13, 'small_blind' => 4000, 'big_blind' => 8000, 'ante' => 8000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 16, 'level_number' => 14, 'small_blind' => 5000, 'big_blind' => 10000, 'ante' => 10000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 17, 'level_number' => 15, 'small_blind' => 6000, 'big_blind' => 12000, 'ante' => 12000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 18, 'level_number' => 16, 'small_blind' => 8000, 'big_blind' => 16000, 'ante' => 16000, 'duration_minutes' => 12, 'is_break' => false, 'note' => 'Kết thúc giải'],
                ],
            ],
            [
                'code' => 'MULTIDAY_DAY_1',
                'name' => 'Multiday Tournament (Day 1)',
                'tournament_type' => TournamentTypeEnum::Normal->value,
                'starting_stack' => 25000,
                'late_reg_until_level' => 10,
                'rebuy_stack' => null,
                'description' => 'Bắt đầu Vòng loại (Level 3) - Stack 25K | Late reg/Rebuy: Hết Level 10 | Thời gian ước tính: 4.5 Giờ',
                'default_price_with_drink' => 125000,
                'default_price_without_drink' => 105000,
                'rewards' => [1 => 200, 2 => 150, 3 => 100, 4 => 80, 5 => 70, 6 => 60, 7 => 50, 8 => 40],
                'levels' => [
                    ['position' => 1, 'level_number' => 1, 'small_blind' => 100, 'big_blind' => 200, 'ante' => 0, 'duration_minutes' => 17, 'is_break' => false, 'note' => 'Bắt đầu Vòng loại (Level 3) - Stack 25K'],
                    ['position' => 2, 'level_number' => 2, 'small_blind' => 200, 'big_blind' => 400, 'ante' => 0, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 3, 'level_number' => 3, 'small_blind' => 300, 'big_blind' => 600, 'ante' => 0, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 4, 'level_number' => 4, 'small_blind' => 400, 'big_blind' => 800, 'ante' => 0, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 5, 'level_number' => 5, 'small_blind' => 500, 'big_blind' => 1000, 'ante' => 1000, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 6, 'level_number' => 6, 'small_blind' => 600, 'big_blind' => 1200, 'ante' => 1200, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 7, 'level_number' => 7, 'small_blind' => 800, 'big_blind' => 1600, 'ante' => 1600, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 8, 'level_number' => 8, 'small_blind' => 1000, 'big_blind' => 2000, 'ante' => 2000, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 9, 'level_number' => 9, 'small_blind' => 1200, 'big_blind' => 2400, 'ante' => 2400, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 10, 'level_number' => 10, 'small_blind' => 1500, 'big_blind' => 3000, 'ante' => 3000, 'duration_minutes' => 17, 'is_break' => false, 'note' => 'Mức Rebuy cuối cùng (Chốt số lượng người)'],
                    ['position' => 11, 'level_number' => null, 'small_blind' => 0, 'big_blind' => 0, 'ante' => 0, 'duration_minutes' => 15, 'is_break' => true, 'note' => 'Nghỉ giải lao để tính mốc cắt 8%'],
                    ['position' => 12, 'level_number' => 11, 'small_blind' => 2000, 'big_blind' => 4000, 'ante' => 4000, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 13, 'level_number' => 12, 'small_blind' => 3000, 'big_blind' => 6000, 'ante' => 6000, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 14, 'level_number' => 13, 'small_blind' => 4000, 'big_blind' => 8000, 'ante' => 8000, 'duration_minutes' => 17, 'is_break' => false, 'note' => null],
                    ['position' => 15, 'level_number' => 14, 'small_blind' => 5000, 'big_blind' => 10000, 'ante' => 10000, 'duration_minutes' => 17, 'is_break' => false, 'note' => 'Dừng giải đấu khi còn đúng 8% người chơi để vào Final Day'],
                ],
            ],
            [
                'code' => 'MINI_HIGH_ROLLER',
                'name' => 'Mini High Roller',
                'tournament_type' => TournamentTypeEnum::DeepStack->value,
                'starting_stack' => 50000,
                'late_reg_until_level' => 10,
                'rebuy_stack' => 50000,
                'description' => 'Bắt đầu giải Cao thủ (Level 5) - Stack 50K | Late reg/Rebuy: Hết Level 10 | Thời gian ước tính: 6.5 Giờ',
                'default_price_with_drink' => 165000,
                'default_price_without_drink' => 165000,
                'rewards' => [1 => 150, 2 => 100, 3 => 50],
                'levels' => [
                    ['position' => 1, 'level_number' => 1, 'small_blind' => 100, 'big_blind' => 200, 'ante' => 0, 'duration_minutes' => 22, 'is_break' => false, 'note' => 'Bắt đầu giải Cao thủ (Level 5) - Stack 50K'],
                    ['position' => 2, 'level_number' => 2, 'small_blind' => 200, 'big_blind' => 400, 'ante' => 0, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 3, 'level_number' => 3, 'small_blind' => 300, 'big_blind' => 600, 'ante' => 0, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 4, 'level_number' => 4, 'small_blind' => 400, 'big_blind' => 800, 'ante' => 0, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 5, 'level_number' => 5, 'small_blind' => 500, 'big_blind' => 1000, 'ante' => 1000, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 6, 'level_number' => 6, 'small_blind' => 600, 'big_blind' => 1200, 'ante' => 1200, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 7, 'level_number' => 7, 'small_blind' => 800, 'big_blind' => 1600, 'ante' => 1600, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 8, 'level_number' => 8, 'small_blind' => 1000, 'big_blind' => 2000, 'ante' => 2000, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 9, 'level_number' => 9, 'small_blind' => 1200, 'big_blind' => 2400, 'ante' => 2400, 'duration_minutes' => 22, 'is_break' => false, 'note' => null],
                    ['position' => 10, 'level_number' => 10, 'small_blind' => 1500, 'big_blind' => 3000, 'ante' => 3000, 'duration_minutes' => 22, 'is_break' => false, 'note' => 'Mức Rebuy cuối cùng'],
                    ['position' => 11, 'level_number' => null, 'small_blind' => 0, 'big_blind' => 0, 'ante' => 0, 'duration_minutes' => 20, 'is_break' => true, 'note' => 'Nghỉ giải lao 20 phút'],
                    ['position' => 12, 'level_number' => 11, 'small_blind' => 2000, 'big_blind' => 4000, 'ante' => 4000, 'duration_minutes' => 15, 'is_break' => false, 'note' => 'Chuyển sang cấu trúc 15 phút/level'],
                    ['position' => 13, 'level_number' => 12, 'small_blind' => 3000, 'big_blind' => 6000, 'ante' => 6000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 14, 'level_number' => 13, 'small_blind' => 4000, 'big_blind' => 8000, 'ante' => 8000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 15, 'level_number' => 14, 'small_blind' => 5000, 'big_blind' => 10000, 'ante' => 10000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 16, 'level_number' => 15, 'small_blind' => 6000, 'big_blind' => 12000, 'ante' => 12000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 17, 'level_number' => 16, 'small_blind' => 8000, 'big_blind' => 16000, 'ante' => 16000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 18, 'level_number' => 17, 'small_blind' => 10000, 'big_blind' => 20000, 'ante' => 20000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 19, 'level_number' => 18, 'small_blind' => 15000, 'big_blind' => 30000, 'ante' => 30000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 20, 'level_number' => 19, 'small_blind' => 20000, 'big_blind' => 40000, 'ante' => 40000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 21, 'level_number' => 20, 'small_blind' => 30000, 'big_blind' => 60000, 'ante' => 60000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 22, 'level_number' => 21, 'small_blind' => 40000, 'big_blind' => 80000, 'ante' => 80000, 'duration_minutes' => 15, 'is_break' => false, 'note' => null],
                    ['position' => 23, 'level_number' => 22, 'small_blind' => 50000, 'big_blind' => 100000, 'ante' => 100000, 'duration_minutes' => 15, 'is_break' => false, 'note' => 'Kết thúc giải'],
                ],
            ],
            [
                'code' => 'HYPER_MAX',
                'name' => 'Bluffing Hyper',
                'tournament_type' => TournamentTypeEnum::Normal->value,
                'starting_stack' => 20000,
                'late_reg_until_level' => 6,
                'rebuy_stack' => 20000,
                'description' => null,
                'default_price_with_drink' => 100000,
                'default_price_without_drink' => 80000,
                'rewards' => [1 => 60, 2 => 40, 3 => 20],
                'levels' => [
                    ['position' => 1, 'level_number' => 1, 'small_blind' => 100, 'big_blind' => 200, 'ante' => 0, 'duration_minutes' => 12, 'is_break' => false, 'note' => 'Bắt đầu (Level 2+) - Stack 20K - Bàn 9 người'],
                    ['position' => 2, 'level_number' => 2, 'small_blind' => 200, 'big_blind' => 400, 'ante' => 0, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 3, 'level_number' => 3, 'small_blind' => 300, 'big_blind' => 600, 'ante' => 0, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 4, 'level_number' => 4, 'small_blind' => 500, 'big_blind' => 1000, 'ante' => 1000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 5, 'level_number' => 5, 'small_blind' => 800, 'big_blind' => 1600, 'ante' => 1600, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 6, 'level_number' => 6, 'small_blind' => 1000, 'big_blind' => 2000, 'ante' => 2000, 'duration_minutes' => 12, 'is_break' => false, 'note' => null],
                    ['position' => 7, 'level_number' => null, 'small_blind' => 0, 'big_blind' => 0, 'ante' => 0, 'duration_minutes' => 10, 'is_break' => true, 'note' => 'Nghỉ giải lao'],
                    ['position' => 8, 'level_number' => 7, 'small_blind' => 1500, 'big_blind' => 3000, 'ante' => 3000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 9, 'level_number' => 8, 'small_blind' => 2000, 'big_blind' => 4000, 'ante' => 4000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 10, 'level_number' => 9, 'small_blind' => 3000, 'big_blind' => 6000, 'ante' => 6000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 11, 'level_number' => 10, 'small_blind' => 4000, 'big_blind' => 8000, 'ante' => 8000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 12, 'level_number' => 11, 'small_blind' => 5000, 'big_blind' => 10000, 'ante' => 10000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 13, 'level_number' => 12, 'small_blind' => 7000, 'big_blind' => 14000, 'ante' => 14000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 14, 'level_number' => null, 'small_blind' => 0, 'big_blind' => 0, 'ante' => 0, 'duration_minutes' => 10, 'is_break' => true, 'note' => 'Nghỉ giải lao'],
                    ['position' => 15, 'level_number' => 13, 'small_blind' => 10000, 'big_blind' => 20000, 'ante' => 20000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 16, 'level_number' => 14, 'small_blind' => 15000, 'big_blind' => 30000, 'ante' => 30000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                    ['position' => 17, 'level_number' => 15, 'small_blind' => 20000, 'big_blind' => 40000, 'ante' => 40000, 'duration_minutes' => 10, 'is_break' => false, 'note' => null],
                ],
            ],
        ];

        foreach ($formats as $payload) {
            $levels = $payload['levels'];
            $rewards = $payload['rewards'];
            unset($payload['levels'], $payload['rewards']);

            $template = TournamentTemplate::query()->updateOrCreate(
                ['code' => $payload['code']],
                $payload,
            );

            $template->levels()->delete();
            $template->levels()->createMany($levels);

            $template->rewards()->delete();
            $template->rewards()->createMany(
                collect($rewards)
                    ->map(fn (int $bpReward, int $position) => [
                        'position' => $position,
                        'bp_reward' => $bpReward,
                    ])
                    ->values()
                    ->all(),
            );
        }
    }
}
