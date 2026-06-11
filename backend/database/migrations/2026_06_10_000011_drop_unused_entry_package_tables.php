<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tournament_registrations', 'tournament_entry_option_id')) {
            Schema::table('tournament_registrations', function (Blueprint $table) {
                $table->dropConstrainedForeignId('tournament_entry_option_id');
            });
        }

        Schema::dropIfExists('tournament_entry_options');
        Schema::dropIfExists('entry_packages');
    }

    public function down(): void
    {
        Schema::create('entry_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedInteger('price')->default(0);
            $table->boolean('includes_prepared_drink')->default(false);
            $table->boolean('includes_free_water')->default(true);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('tournament_entry_options', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entry_package_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('price');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tournament_id', 'entry_package_id']);
        });

        Schema::table('tournament_registrations', function (Blueprint $table) {
            $table->foreignId('tournament_entry_option_id')
                ->nullable()
                ->after('user_id')
                ->constrained()
                ->nullOnDelete();
        });
    }
};
