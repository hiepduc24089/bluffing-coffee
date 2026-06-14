<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\BadgeController;
use App\Http\Controllers\Api\Admin\BpTransactionController;
use App\Http\Controllers\Api\Admin\LeaderboardController;
use App\Http\Controllers\Api\Admin\RewardProfileController;
use App\Http\Controllers\Api\Admin\TournamentBpTransactionController;
use App\Http\Controllers\Api\Admin\TournamentRegistrationController;
use App\Http\Controllers\Api\Admin\TournamentRewardController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Main\MainAuthController;
use App\Http\Controllers\Api\TournamentController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [AdminAuthController::class, 'login'])->name('login');
    });

    Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::get('me', [AdminAuthController::class, 'me'])->name('me');
            Route::post('logout', [AdminAuthController::class, 'logout'])->name('logout');
        });

        Route::prefix('reward-profiles')->name('reward-profiles.')->group(function () {
            Route::get('/', [RewardProfileController::class, 'index'])->name('index');
            Route::post('/', [RewardProfileController::class, 'store'])->name('store');
            Route::get('{reward_profile}', [RewardProfileController::class, 'show'])->name('show');
            Route::match(['put', 'patch'], '{reward_profile}', [RewardProfileController::class, 'update'])
                ->name('update');
            Route::delete('{reward_profile}', [RewardProfileController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('tournaments')->name('tournaments.')->group(function () {
            Route::get('/', [TournamentController::class, 'index'])->name('index');
            Route::post('/', [TournamentController::class, 'store'])->name('store');
            Route::get('{tournament}', [TournamentController::class, 'show'])->name('show');
            Route::match(['put', 'patch'], '{tournament}', [TournamentController::class, 'update'])
                ->name('update');
            Route::delete('{tournament}', [TournamentController::class, 'destroy'])->name('destroy');

            Route::prefix('{tournament}/registrations')->name('registrations.')->group(function () {
                Route::get('/', [TournamentRegistrationController::class, 'index'])->name('index');
                Route::post('/', [TournamentRegistrationController::class, 'store'])->name('store');
            });

            Route::post('{tournament}/finalize-rewards', [TournamentRewardController::class, 'finalize'])
                ->name('finalize-rewards');
            Route::get('{tournament}/reward-preview', [TournamentRewardController::class, 'preview'])
                ->name('reward-preview');

            Route::get('{tournament}/bp-transactions', [TournamentBpTransactionController::class, 'index'])
                ->name('bp-transactions.index');
        });

        Route::prefix('tournament-registrations')->name('tournament-registrations.')->group(function () {
            Route::put('{registration}', [TournamentRegistrationController::class, 'update'])->name('update');
            Route::delete('{registration}', [TournamentRegistrationController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('bp-transactions')->name('bp-transactions.')->group(function () {
            Route::put('{transaction}', [TournamentBpTransactionController::class, 'update'])->name('update');
            Route::delete('{transaction}', [TournamentBpTransactionController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('users')->name('users.')->group(function () {
            Route::get('{user}/bp-transactions', [BpTransactionController::class, 'index'])
                ->name('bp-transactions.index');
            Route::post('{user}/bp-adjustments', [BpTransactionController::class, 'adjust'])
                ->name('bp-adjustments.store');
            Route::post('{user}/reset-password', [UserController::class, 'resetPassword'])
                ->name('reset-password');
            Route::post('{user}/badges', [UserController::class, 'attachBadge'])
                ->name('badges.attach');
            Route::delete('{user}/badges/{badge}', [UserController::class, 'detachBadge'])
                ->name('badges.detach');
        });

        Route::get('leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard.index');
        Route::apiResource('users', UserController::class);
        Route::apiResource('badges', BadgeController::class)->except(['show']);
    });
});

Route::prefix('main')->name('main.')->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [MainAuthController::class, 'login'])->name('login');
    });

    Route::prefix('tournaments')->name('tournaments.')->group(function () {
        Route::get('/', [TournamentController::class, 'index'])->name('index');
        Route::get('{tournament}', [TournamentController::class, 'show'])->name('show');
    });

    Route::middleware(['auth:sanctum', 'role:member'])->group(function () {
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::get('me', [MainAuthController::class, 'me'])->name('me');
            Route::post('logout', [MainAuthController::class, 'logout'])->name('logout');
        });
    });
});
