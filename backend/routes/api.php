<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Main\MainAuthController;
use App\Http\Controllers\Api\TournamentController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::post('auth/login', [AdminAuthController::class, 'login'])->name('auth.login');

    Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
        Route::get('auth/me', [AdminAuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AdminAuthController::class, 'logout'])->name('auth.logout');

        Route::apiResource('tournaments', TournamentController::class);
    });
});

Route::prefix('main')->name('main.')->group(function () {
    Route::post('auth/login', [MainAuthController::class, 'login'])->name('auth.login');

    Route::get('tournaments', [TournamentController::class, 'index'])->name('tournaments.index');
    Route::get('tournaments/{tournament}', [TournamentController::class, 'show'])->name('tournaments.show');

    Route::middleware(['auth:sanctum', 'role:member'])->group(function () {
        Route::get('auth/me', [MainAuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [MainAuthController::class, 'logout'])->name('auth.logout');
    });
});
