<?php

namespace App\Providers;

use App\Support\ShiftTimeResolver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ShiftTimeResolver::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $credential = (string) ($request->input('email') ?? $request->input('phone') ?? '');

            return Limit::perMinute(5)->by(Str::lower($credential).'|'.$request->ip());
        });
    }
}
