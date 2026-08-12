<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Gộp `reward_profiles` vào `game_formats` và đổi tên thành `tournament_templates`.
 *
 * Một giải đấu trước đây chọn độc lập chế độ chơi và mẫu thưởng; từ nay chỉ chọn
 * một mẫu giải đấu duy nhất mang cả cấu trúc blind lẫn bảng BP thưởng và giá vé.
 *
 * `down()` chỉ dựng lại schema, KHÔNG khôi phục dữ liệu reward profile đã bị gộp.
 * Dump database trước khi chạy trên production.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->renameGameFormatTables();
        $this->addRewardColumnsAndTable();
        $this->backfillRewardsFromProfiles();
        $this->dropRewardProfileTables();
    }

    public function down(): void
    {
        Schema::create('reward_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('default_price_with_drink')->default(0);
            $table->unsignedInteger('default_price_without_drink')->default(0);
            $table->timestamps();
        });

        Schema::create('reward_profile_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reward_profile_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->unsignedInteger('bp_reward');
            $table->timestamps();

            $table->unique(['reward_profile_id', 'position']);
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->foreignId('reward_profile_id')
                ->nullable()
                ->after('capacity')
                ->constrained('reward_profiles')
                ->nullOnDelete();
        });

        Schema::dropIfExists('tournament_template_rewards');

        Schema::table('tournament_templates', function (Blueprint $table) {
            $table->dropColumn(['default_price_with_drink', 'default_price_without_drink']);
            $table->boolean('is_active')->default(true);
        });

        Schema::table('tournament_template_levels', function (Blueprint $table) {
            $table->dropForeign(['tournament_template_id']);
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropForeign(['tournament_template_id']);
        });

        Schema::table('tournament_template_levels', function (Blueprint $table) {
            $table->renameColumn('tournament_template_id', 'game_format_id');
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->renameColumn('tournament_template_id', 'game_format_id');
        });

        Schema::rename('tournament_template_levels', 'game_format_levels');
        Schema::rename('tournament_templates', 'game_formats');

        Schema::table('game_format_levels', function (Blueprint $table) {
            $table->foreign('game_format_id')
                ->references('id')
                ->on('game_formats')
                ->cascadeOnDelete();
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->foreign('game_format_id')
                ->references('id')
                ->on('game_formats')
                ->nullOnDelete();
        });
    }

    /**
     * Khoá ngoại phải gỡ trước khi đổi tên cột, MySQL không cho đổi tên cột đang
     * bị ràng buộc tham chiếu.
     */
    private function renameGameFormatTables(): void
    {
        Schema::table('game_format_levels', function (Blueprint $table) {
            $table->dropForeign(['game_format_id']);
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropForeign(['game_format_id']);
        });

        Schema::rename('game_formats', 'tournament_templates');
        Schema::rename('game_format_levels', 'tournament_template_levels');

        Schema::table('tournament_template_levels', function (Blueprint $table) {
            $table->renameColumn('game_format_id', 'tournament_template_id');
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->renameColumn('game_format_id', 'tournament_template_id');
        });

        Schema::table('tournament_template_levels', function (Blueprint $table) {
            $table->foreign('tournament_template_id')
                ->references('id')
                ->on('tournament_templates')
                ->cascadeOnDelete();
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->foreign('tournament_template_id')
                ->references('id')
                ->on('tournament_templates')
                ->nullOnDelete();
        });
    }

    private function addRewardColumnsAndTable(): void
    {
        Schema::table('tournament_templates', function (Blueprint $table) {
            $table->unsignedInteger('default_price_with_drink')->default(0)->after('description');
            $table->unsignedInteger('default_price_without_drink')->default(0)->after('default_price_with_drink');
            $table->dropColumn('is_active');
        });

        Schema::create('tournament_template_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_template_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->unsignedInteger('bp_reward');
            $table->timestamps();

            // Tên mặc định do Laravel sinh vượt quá giới hạn 64 ký tự của MySQL.
            $table->unique(['tournament_template_id', 'position'], 'tt_rewards_template_position_unique');
        });
    }

    /**
     * Mỗi cặp (mẫu giải, mẫu thưởng) đang được dùng thật trở thành một mẫu giải đấu.
     * Cặp đầu tiên ghi thẳng lên mẫu gốc, các cặp sau nhân bản mẫu gốc ra bản mới.
     */
    private function backfillRewardsFromProfiles(): void
    {
        if (! Schema::hasTable('reward_profiles')) {
            return;
        }

        $profiles = DB::table('reward_profiles')->get()->keyBy('id');
        $itemsByProfile = DB::table('reward_profile_items')->get()->groupBy('reward_profile_id');

        $pairs = DB::table('tournaments')
            ->select('tournament_template_id', 'reward_profile_id')
            ->whereNotNull('tournament_template_id')
            ->whereNotNull('reward_profile_id')
            ->distinct()
            ->get();

        $claimedTemplates = [];

        foreach ($pairs as $pair) {
            $profile = $profiles->get($pair->reward_profile_id);

            if ($profile === null) {
                continue;
            }

            $items = $itemsByProfile->get($pair->reward_profile_id, collect());

            if (! in_array($pair->tournament_template_id, $claimedTemplates, true)) {
                $claimedTemplates[] = $pair->tournament_template_id;
                $this->writeRewards($pair->tournament_template_id, $profile, $items);

                continue;
            }

            $cloneId = $this->cloneTemplate($pair->tournament_template_id, $profile);
            $this->writeRewards($cloneId, $profile, $items);

            DB::table('tournaments')
                ->where('tournament_template_id', $pair->tournament_template_id)
                ->where('reward_profile_id', $pair->reward_profile_id)
                ->update(['tournament_template_id' => $cloneId]);
        }

        $this->rescueTournamentsWithoutTemplate($profiles, $itemsByProfile);
    }

    /**
     * Giải đấu có mẫu thưởng nhưng chưa gắn chế độ chơi sẽ mất sạch cấu hình BP nếu
     * không xử lý, nên dựng cho mỗi mẫu thưởng như vậy một mẫu giải đấu rỗng cấu trúc.
     *
     * @param  \Illuminate\Support\Collection<int, object>  $profiles
     * @param  \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, object>>  $itemsByProfile
     */
    private function rescueTournamentsWithoutTemplate($profiles, $itemsByProfile): void
    {
        $orphanProfileIds = DB::table('tournaments')
            ->whereNull('tournament_template_id')
            ->whereNotNull('reward_profile_id')
            ->distinct()
            ->pluck('reward_profile_id');

        foreach ($orphanProfileIds as $profileId) {
            $profile = $profiles->get($profileId);

            if ($profile === null) {
                continue;
            }

            $templateId = DB::table('tournament_templates')->insertGetId([
                'name' => $profile->name,
                'code' => $this->availableCode('RP_'.$profile->code),
                'tournament_type' => 'normal',
                'starting_stack' => 0,
                'late_reg_until_level' => null,
                'max_rebuy' => null,
                'rebuy_stack' => null,
                'description' => 'Tạo tự động khi gộp mẫu thưởng, chưa có cấu trúc blind.',
                'default_price_with_drink' => $profile->default_price_with_drink,
                'default_price_without_drink' => $profile->default_price_without_drink,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->writeRewards($templateId, $profile, $itemsByProfile->get($profileId, collect()));

            DB::table('tournaments')
                ->whereNull('tournament_template_id')
                ->where('reward_profile_id', $profileId)
                ->update(['tournament_template_id' => $templateId]);
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, object>  $items
     */
    private function writeRewards(int $templateId, object $profile, $items): void
    {
        DB::table('tournament_templates')
            ->where('id', $templateId)
            ->update([
                'default_price_with_drink' => $profile->default_price_with_drink,
                'default_price_without_drink' => $profile->default_price_without_drink,
                'updated_at' => now(),
            ]);

        foreach ($items as $item) {
            DB::table('tournament_template_rewards')->updateOrInsert(
                [
                    'tournament_template_id' => $templateId,
                    'position' => $item->position,
                ],
                [
                    'bp_reward' => $item->bp_reward,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    private function cloneTemplate(int $sourceId, object $profile): int
    {
        $source = DB::table('tournament_templates')->where('id', $sourceId)->first();

        $cloneId = DB::table('tournament_templates')->insertGetId([
            'name' => Str::limit($source->name.' — '.$profile->name, 255, ''),
            'code' => $this->availableCode($source->code.'_'.$profile->code),
            'tournament_type' => $source->tournament_type,
            'starting_stack' => $source->starting_stack,
            'late_reg_until_level' => $source->late_reg_until_level,
            'max_rebuy' => $source->max_rebuy,
            'rebuy_stack' => $source->rebuy_stack,
            'description' => $source->description,
            'default_price_with_drink' => $source->default_price_with_drink,
            'default_price_without_drink' => $source->default_price_without_drink,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $levels = DB::table('tournament_template_levels')
            ->where('tournament_template_id', $sourceId)
            ->orderBy('position')
            ->get();

        foreach ($levels as $level) {
            DB::table('tournament_template_levels')->insert([
                'tournament_template_id' => $cloneId,
                'position' => $level->position,
                'level_number' => $level->level_number,
                'small_blind' => $level->small_blind,
                'big_blind' => $level->big_blind,
                'ante' => $level->ante,
                'duration_minutes' => $level->duration_minutes,
                'is_break' => $level->is_break,
                'note' => $level->note,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $cloneId;
    }

    private function availableCode(string $base): string
    {
        $base = Str::limit($base, 90, '');
        $candidate = $base;
        $suffix = 1;

        while (DB::table('tournament_templates')->where('code', $candidate)->exists()) {
            $suffix++;
            $candidate = $base.'_'.$suffix;
        }

        return $candidate;
    }

    private function dropRewardProfileTables(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reward_profile_id');
        });

        Schema::dropIfExists('reward_profile_items');
        Schema::dropIfExists('reward_profiles');
    }
};
