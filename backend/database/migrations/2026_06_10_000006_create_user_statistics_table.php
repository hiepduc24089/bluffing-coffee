<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_statistics', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total_bp_earned')->default(0);
            $table->unsignedInteger('tournaments_played')->default(0);
            $table->unsignedInteger('championships_won')->default(0);
            $table->unsignedInteger('sitngo_wins')->default(0);
            $table->unsignedInteger('turbo_wins')->default(0);
            $table->unsignedInteger('deepstack_wins')->default(0);
            $table->timestamp('last_played_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_statistics');
    }
};
