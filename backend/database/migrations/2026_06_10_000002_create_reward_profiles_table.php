<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->boolean('is_active')->default(true);
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
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_profile_items');
        Schema::dropIfExists('reward_profiles');
    }
};
