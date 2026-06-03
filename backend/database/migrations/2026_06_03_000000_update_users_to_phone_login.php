<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'email') && ! Schema::hasColumn('users', 'phone')) {
                    $table->renameColumn('email', 'phone');
                }

                if (Schema::hasColumn('users', 'email_verified_at')) {
                    $table->dropColumn('email_verified_at');
                }
            });
        }

        if (Schema::hasTable('password_reset_tokens')) {
            Schema::table('password_reset_tokens', function (Blueprint $table) {
                if (Schema::hasColumn('password_reset_tokens', 'email') && ! Schema::hasColumn('password_reset_tokens', 'phone')) {
                    $table->renameColumn('email', 'phone');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'phone') && ! Schema::hasColumn('users', 'email')) {
                    $table->renameColumn('phone', 'email');
                }

                if (! Schema::hasColumn('users', 'email_verified_at')) {
                    $table->timestamp('email_verified_at')->nullable()->after('role');
                }
            });
        }

        if (Schema::hasTable('password_reset_tokens')) {
            Schema::table('password_reset_tokens', function (Blueprint $table) {
                if (Schema::hasColumn('password_reset_tokens', 'phone') && ! Schema::hasColumn('password_reset_tokens', 'email')) {
                    $table->renameColumn('phone', 'email');
                }
            });
        }
    }
};
