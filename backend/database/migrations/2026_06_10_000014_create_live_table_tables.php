<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_tables', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->foreignUuid('current_tournament_id')->nullable()->constrained('tournaments')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('live_table_seats', function (Blueprint $table) {
            $table->id();
            $table->string('table_key');
            $table->foreignUuid('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tournament_registration_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('seat_number');
            $table->timestamps();

            $table->unique(['table_key', 'tournament_id', 'seat_number'], 'live_table_unique_seat');
            $table->unique(['tournament_id', 'tournament_registration_id'], 'live_table_unique_registration');
            $table->index(['tournament_id', 'table_key']);
        });

        Schema::create('live_tournament_player_states', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tournament_registration_id')->constrained()->cascadeOnDelete();
            $table->string('state')->default('active')->index();
            $table->timestamp('state_changed_at')->nullable();
            $table->timestamps();

            $table->unique(['tournament_id', 'tournament_registration_id'], 'live_state_unique_registration');
        });

        Schema::create('tournament_live_events', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tournament_id')->constrained()->cascadeOnDelete();
            $table->string('table_key')->nullable()->index();
            $table->foreignId('tournament_registration_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->string('event_type')->index();
            $table->string('from_table_key')->nullable();
            $table->unsignedTinyInteger('from_seat_number')->nullable();
            $table->string('to_table_key')->nullable();
            $table->unsignedTinyInteger('to_seat_number')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tournament_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_live_events');
        Schema::dropIfExists('live_tournament_player_states');
        Schema::dropIfExists('live_table_seats');
        Schema::dropIfExists('live_tables');
    }
};
