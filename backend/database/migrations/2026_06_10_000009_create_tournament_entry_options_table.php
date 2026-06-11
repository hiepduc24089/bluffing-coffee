<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tournaments', 'entry_package_id')) {
            Schema::table('tournaments', function (Blueprint $table) {
                $table->dropConstrainedForeignId('entry_package_id');
            });
        }

        Schema::create('tournament_entry_options', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entry_package_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('price');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tournament_id', 'entry_package_id']);
            $table->index(['tournament_id', 'is_active']);
        });

        Schema::table('tournament_registrations', function (Blueprint $table) {
            $table->foreignId('tournament_entry_option_id')
                ->nullable()
                ->after('user_id')
                ->constrained()
                ->nullOnDelete();
            $table->unsignedInteger('entry_price')->default(0)->after('tournament_entry_option_id');
        });
    }

    public function down(): void
    {
        Schema::table('tournament_registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tournament_entry_option_id');
            $table->dropColumn('entry_price');
        });

        Schema::dropIfExists('tournament_entry_options');

        if (! Schema::hasColumn('tournaments', 'entry_package_id')) {
            Schema::table('tournaments', function (Blueprint $table) {
                $table->foreignId('entry_package_id')
                    ->nullable()
                    ->after('reward_profile_id')
                    ->constrained()
                    ->nullOnDelete();
            });
        }
    }
};
