<?php

namespace App\Http\Controllers\Api\Admin;

use App\DTOs\LoginDTO;
use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\AuthUserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            LoginDTO::fromArray($request->validated()),
            UserRoleEnum::Admin,
            'admin-api-token',
        );

        return response()->json([
            'data' => [
                'user' => AuthUserResource::make($result['user']),
                'token' => $result['token'],
                'tokenType' => 'Bearer',
            ],
        ]);
    }

    public function me(Request $request): AuthUserResource
    {
        return AuthUserResource::make($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
