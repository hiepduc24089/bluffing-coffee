<?php

use App\Enums\TournamentStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournaments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->unsignedInteger('buy_in')->default(0);
            $table->unsignedInteger('capacity');
            $table->enum('status', TournamentStatusEnum::values())->default(TournamentStatusEnum::Draft->value);
            $table->dateTime('start_at');
            $table->timestamps();

            $table->index('name');
            $table->index('status');
            $table->index('start_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};
