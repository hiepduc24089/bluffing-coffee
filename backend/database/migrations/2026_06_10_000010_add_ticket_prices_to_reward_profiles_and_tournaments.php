<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reward_profiles', function (Blueprint $table) {
            $table->unsignedInteger('default_price_with_drink')->default(0)->after('is_active');
            $table->unsignedInteger('default_price_without_drink')->default(0)->after('default_price_with_drink');
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->unsignedInteger('ticket_price_with_drink')->default(0)->after('buy_in');
            $table->unsignedInteger('ticket_price_without_drink')->default(0)->after('ticket_price_with_drink');
        });

        Schema::table('tournament_registrations', function (Blueprint $table) {
            $table->string('entry_type')->nullable()->after('entry_price');
        });
    }

    public function down(): void
    {
        Schema::table('tournament_registrations', function (Blueprint $table) {
            $table->dropColumn('entry_type');
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropColumn(['ticket_price_with_drink', 'ticket_price_without_drink']);
        });

        Schema::table('reward_profiles', function (Blueprint $table) {
            $table->dropColumn(['default_price_with_drink', 'default_price_without_drink']);
        });
    }
};
