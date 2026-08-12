<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminHasPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $admin = $request->user();

        if (! $admin instanceof Admin || ! $admin->hasPermission($permission)) {
            abort(Response::HTTP_FORBIDDEN, 'Tài khoản này không có quyền thực hiện thao tác này.');
        }

        return $next($request);
    }
}
