<?php

namespace App\Http\Middleware;

use App\Enums\UserRoleEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRoleEnum::from($role)) {
            abort(Response::HTTP_FORBIDDEN, 'Tài khoản này không có quyền truy cập khu vực này.');
        }

        return $next($request);
    }
}
