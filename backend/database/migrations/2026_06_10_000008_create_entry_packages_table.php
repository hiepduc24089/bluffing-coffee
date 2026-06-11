<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedInteger('price');
            $table->boolean('includes_prepared_drink')->default(false);
            $table->boolean('includes_free_water')->default(true);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->foreignId('entry_package_id')
                ->nullable()
                ->after('reward_profile_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('entry_package_id');
        });

        Schema::dropIfExists('entry_packages');
    }
};
