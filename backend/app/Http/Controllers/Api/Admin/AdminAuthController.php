<?php

namespace App\Http\Controllers\Api\Admin;

use App\DTOs\LoginDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\AdminResource;
use App\Models\Admin;
use App\Services\AdminAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthController extends Controller
{
    public function __construct(
        private readonly AdminAuthService $authService,
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(LoginDTO::fromArray($request->validated()));

        return response()->json([
            'data' => [
                'user' => AdminResource::make($result['admin']),
                'token' => $result['token'],
                'tokenType' => 'Bearer',
            ],
        ]);
    }

    public function me(Request $request): AdminResource
    {
        /** @var Admin $admin */
        $admin = $request->user();

        return AdminResource::make($admin);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var Admin $admin */
        $admin = $request->user();

        $this->authService->logout($admin);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
