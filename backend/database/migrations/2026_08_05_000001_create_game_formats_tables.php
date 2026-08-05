<?php

use App\Enums\TournamentTypeEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_formats', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('tournament_type')->default(TournamentTypeEnum::Normal->value);
            $table->unsignedInteger('starting_stack');
            $table->unsignedSmallInteger('late_reg_until_level')->nullable();
            $table->unsignedSmallInteger('max_rebuy')->nullable();
            $table->unsignedInteger('rebuy_stack')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('tournament_type');
            $table->index('is_active');
        });

        Schema::create('game_format_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_format_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->unsignedSmallInteger('level_number')->nullable();
            $table->unsignedInteger('small_blind')->default(0);
            $table->unsignedInteger('big_blind')->default(0);
            $table->unsignedInteger('ante')->default(0);
            $table->unsignedSmallInteger('duration_minutes');
            $table->boolean('is_break')->default(false);
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['game_format_id', 'position']);
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->foreignId('game_format_id')
                ->nullable()
                ->after('tournament_type')
                ->constrained('game_formats')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('game_format_id');
        });

        Schema::dropIfExists('game_format_levels');
        Schema::dropIfExists('game_formats');
    }
};
