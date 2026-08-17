<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\BadgeController;
use App\Http\Controllers\Api\Admin\BannerController;
use App\Http\Controllers\Api\Admin\BpTransactionController;
use App\Http\Controllers\Api\Admin\ContentPageController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\LeaderboardController;
use App\Http\Controllers\Api\Admin\LiveTableController;
use App\Http\Controllers\Api\Admin\Pos365PartnerImportController;
use App\Http\Controllers\Api\Admin\SettingImageController;
use App\Http\Controllers\Api\Admin\StaffController;
use App\Http\Controllers\Api\Admin\TournamentBpTransactionController;
use App\Http\Controllers\Api\Admin\TournamentRegistrationController;
use App\Http\Controllers\Api\Admin\TournamentRewardController;
use App\Http\Controllers\Api\Admin\TournamentTemplateController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Main\MainAuthController;
use App\Http\Controllers\Api\Main\TournamentCheckInController;
use App\Http\Controllers\Api\Main\TournamentTemplateController as MainTournamentTemplateController;
use App\Http\Controllers\Api\TournamentController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [AdminAuthController::class, 'login'])
            ->middleware('throttle:login')
            ->name('login');
    });

    Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::get('me', [AdminAuthController::class, 'me'])->name('me');
            Route::post('logout', [AdminAuthController::class, 'logout'])->name('logout');
        });

        Route::prefix('staff')->name('staff.')
            ->middleware('permission:special.manage_staff')
            ->group(function () {
                Route::get('/', [StaffController::class, 'index'])->name('index');
                Route::post('/', [StaffController::class, 'store'])->name('store');
                Route::put('{staff}', [StaffController::class, 'update'])->name('update');
                Route::put('{staff}/permissions', [StaffController::class, 'syncPermissions'])
                    ->name('permissions.update');
                Route::delete('{staff}', [StaffController::class, 'destroy'])->name('destroy');
            });

        Route::get('permissions/catalog', [StaffController::class, 'catalog'])
            ->middleware('permission:special.manage_staff')
            ->name('permissions.catalog');

        Route::prefix('tournament-templates')->name('tournament-templates.')->group(function () {
            Route::get('/', [TournamentTemplateController::class, 'index'])
                ->middleware('permission:tournament_template.view')->name('index');
            Route::post('/', [TournamentTemplateController::class, 'store'])
                ->middleware('permission:tournament_template.create')->name('store');
            Route::post('{tournament_template}/duplicate', [TournamentTemplateController::class, 'duplicate'])
                ->middleware('permission:tournament_template.create')->name('duplicate');
            Route::get('{tournament_template}', [TournamentTemplateController::class, 'show'])
                ->middleware('permission:tournament_template.view')->name('show');
            Route::match(['put', 'patch'], '{tournament_template}', [TournamentTemplateController::class, 'update'])
                ->middleware('permission:tournament_template.update')->name('update');
            Route::delete('{tournament_template}', [TournamentTemplateController::class, 'destroy'])
                ->middleware('permission:tournament_template.delete')->name('destroy');
        });

        Route::prefix('tournaments')->name('tournaments.')->group(function () {
            Route::get('/', [TournamentController::class, 'index'])
                ->middleware('permission:tournament.view')->name('index');
            Route::post('/', [TournamentController::class, 'store'])
                ->middleware('permission:tournament.create')->name('store');
            Route::get('{tournament}', [TournamentController::class, 'show'])
                ->middleware('permission:tournament.view')->name('show');
            Route::match(['put', 'patch'], '{tournament}', [TournamentController::class, 'update'])
                ->middleware('permission:tournament.update')->name('update');
            Route::delete('{tournament}', [TournamentController::class, 'destroy'])
                ->middleware('permission:tournament.delete')->name('destroy');

            Route::prefix('{tournament}/registrations')->name('registrations.')->group(function () {
                Route::get('/', [TournamentRegistrationController::class, 'index'])
                    ->middleware('permission:tournament_registration.view')->name('index');
                Route::post('/', [TournamentRegistrationController::class, 'store'])
                    ->middleware('permission:tournament_registration.create')->name('store');
            });

            Route::post('{tournament}/finalize-rewards', [TournamentRewardController::class, 'finalize'])
                ->middleware('permission:special.finalize_rewards')->name('finalize-rewards');
            Route::get('{tournament}/reward-preview', [TournamentRewardController::class, 'preview'])
                ->middleware('permission:tournament.view')->name('reward-preview');

            Route::get('{tournament}/bp-transactions', [TournamentBpTransactionController::class, 'index'])
                ->middleware('permission:tournament.view')->name('bp-transactions.index');
        });

        Route::prefix('tournament-registrations')->name('tournament-registrations.')->group(function () {
            Route::put('{registration}', [TournamentRegistrationController::class, 'update'])
                ->middleware('permission:tournament_registration.update')->name('update');
            Route::delete('{registration}', [TournamentRegistrationController::class, 'destroy'])
                ->middleware('permission:tournament_registration.delete')->name('destroy');
        });

        Route::prefix('bp-transactions')->name('bp-transactions.')
            ->middleware('permission:special.adjust_bp')
            ->group(function () {
                Route::put('{transaction}', [TournamentBpTransactionController::class, 'update'])->name('update');
                Route::delete('{transaction}', [TournamentBpTransactionController::class, 'destroy'])->name('destroy');
            });

        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [UserController::class, 'index'])
                ->middleware('permission:user.view')->name('index');
            Route::post('/', [UserController::class, 'store'])
                ->middleware('permission:user.create')->name('store');
            Route::get('{user}', [UserController::class, 'show'])
                ->middleware('permission:user.view')->name('show');
            Route::match(['put', 'patch'], '{user}', [UserController::class, 'update'])
                ->middleware('permission:user.update')->name('update');
            Route::delete('{user}', [UserController::class, 'destroy'])
                ->middleware('permission:user.delete')->name('destroy');

            Route::get('{user}/bp-transactions', [BpTransactionController::class, 'index'])
                ->middleware('permission:user.view')->name('bp-transactions.index');
            Route::post('{user}/bp-adjustments', [BpTransactionController::class, 'adjust'])
                ->middleware('permission:special.adjust_bp')->name('bp-adjustments.store');
            Route::post('{user}/reset-password', [UserController::class, 'resetPassword'])
                ->middleware('permission:special.reset_member_password')->name('reset-password');
            Route::post('{user}/badges', [UserController::class, 'attachBadge'])
                ->middleware('permission:user.update')->name('badges.attach');
            Route::delete('{user}/badges/{badge}', [UserController::class, 'detachBadge'])
                ->middleware('permission:user.update')->name('badges.detach');
        });

        Route::get('dashboard', [DashboardController::class, 'index'])
            ->middleware('permission:dashboard.view')->name('dashboard.index');

        Route::get('leaderboard', [LeaderboardController::class, 'index'])
            ->middleware('permission:leaderboard.view')->name('leaderboard.index');

        Route::prefix('live-tables')->name('live-tables.')->group(function () {
            Route::get('tournaments/today', [LiveTableController::class, 'todayTournaments'])
                ->middleware('permission:live_table.view')->name('tournaments.today');
            Route::get('tournaments/{tournament}/overview', [LiveTableController::class, 'overview'])
                ->middleware('permission:live_table.view')->name('tournaments.overview');
            Route::get('{tableKey}', [LiveTableController::class, 'show'])
                ->middleware('permission:live_table.view')->name('show');
            Route::put('{tableKey}/tournament', [LiveTableController::class, 'selectTournament'])
                ->middleware('permission:live_table.update')->name('tournament.update');
            Route::post('{tableKey}/seats/move', [LiveTableController::class, 'move'])
                ->middleware('permission:live_table.update')->name('seats.move');
            Route::post('{tableKey}/merge', [LiveTableController::class, 'merge'])
                ->middleware('permission:live_table.update')->name('merge');
            Route::delete('{tableKey}/seats/{seatNumber}', [LiveTableController::class, 'clear'])
                ->middleware('permission:live_table.update')->name('seats.clear');
            Route::post('{tableKey}/seats/{seatNumber}/eliminate', [LiveTableController::class, 'eliminate'])
                ->middleware('permission:live_table.update')->name('seats.eliminate');
            Route::post('registrations/{registration}/rebuy', [LiveTableController::class, 'rebuy'])
                ->middleware('permission:live_table.update')->name('registrations.rebuy');
        });

        Route::prefix('badges')->name('badges.')->group(function () {
            Route::get('/', [BadgeController::class, 'index'])
                ->middleware('permission:badge.view')->name('index');
            Route::post('/', [BadgeController::class, 'store'])
                ->middleware('permission:badge.create')->name('store');
            Route::match(['put', 'patch'], '{badge}', [BadgeController::class, 'update'])
                ->middleware('permission:badge.update')->name('update');
            Route::delete('{badge}', [BadgeController::class, 'destroy'])
                ->middleware('permission:badge.delete')->name('destroy');
        });

        Route::prefix('content-pages')->name('content-pages.')->group(function () {
            Route::get('/', [ContentPageController::class, 'index'])
                ->middleware('permission:setting.view')->name('index');
            Route::post('/', [ContentPageController::class, 'store'])
                ->middleware('permission:setting.create')->name('store');
            Route::match(['put', 'patch'], '{content_page}', [ContentPageController::class, 'update'])
                ->middleware('permission:setting.update')->name('update');
            Route::delete('{content_page}', [ContentPageController::class, 'destroy'])
                ->middleware('permission:setting.delete')->name('destroy');
        });

        Route::prefix('banners')->name('banners.')->group(function () {
            Route::get('/', [BannerController::class, 'index'])
                ->middleware('permission:setting.view')->name('index');
            Route::post('/', [BannerController::class, 'store'])
                ->middleware('permission:setting.create')->name('store');
            Route::match(['put', 'patch'], '{banner}', [BannerController::class, 'update'])
                ->middleware('permission:setting.update')->name('update');
            Route::delete('{banner}', [BannerController::class, 'destroy'])
                ->middleware('permission:setting.delete')->name('destroy');
        });

        Route::prefix('pos365')->name('pos365.')->group(function () {
            Route::get('status', [Pos365PartnerImportController::class, 'status'])
                ->middleware('permission:pos365.view')->name('status');
            Route::post('sync', [Pos365PartnerImportController::class, 'sync'])
                ->middleware('permission:pos365.update')->name('sync');

            Route::prefix('partner-imports')->name('partner-imports.')->group(function () {
                Route::get('/', [Pos365PartnerImportController::class, 'index'])
                    ->middleware('permission:pos365.view')->name('index');
                Route::post('{partnerImport}/link', [Pos365PartnerImportController::class, 'link'])
                    ->middleware('permission:pos365.update')->name('link');
                Route::post('{partnerImport}/ignore', [Pos365PartnerImportController::class, 'ignore'])
                    ->middleware('permission:pos365.update')->name('ignore');
            });
        });

        Route::post('setting-images', [SettingImageController::class, 'store'])
            ->middleware('permission:setting.create')->name('setting-images.store');
    });
});

Route::prefix('main')->name('main.')->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [MainAuthController::class, 'login'])
            ->middleware('throttle:login')
            ->name('login');
    });

    Route::prefix('tournaments')->name('tournaments.')->group(function () {
        Route::get('/', [TournamentController::class, 'index'])->name('index');
        Route::get('{tournament}', [TournamentController::class, 'show'])->name('show');
    });

    Route::prefix('tournament-templates')->name('tournament-templates.')->group(function () {
        Route::get('/', [MainTournamentTemplateController::class, 'index'])->name('index');
        Route::get('{code}', [MainTournamentTemplateController::class, 'show'])->name('show');
    });

    Route::middleware(['auth:sanctum', 'role:member'])->group(function () {
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::get('me', [MainAuthController::class, 'me'])->name('me');
            Route::post('logout', [MainAuthController::class, 'logout'])->name('logout');
        });

        Route::prefix('check-in')->name('check-in.')->group(function () {
            Route::get('tournaments/today', [TournamentCheckInController::class, 'todayTournaments'])
                ->name('tournaments.today');
            Route::get('current', [TournamentCheckInController::class, 'current'])->name('current');
            Route::post('/', [TournamentCheckInController::class, 'store'])->name('store');
        });
    });
});
