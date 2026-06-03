<?php

namespace App\Http\Controllers\Api\Main;

use App\DTOs\PhoneLoginDTO;
use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\MainLoginRequest;
use App\Http\Resources\AuthUserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MainAuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {
    }

    public function login(MainLoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            PhoneLoginDTO::fromArray($request->validated()),
            UserRoleEnum::Member,
            'main-api-token',
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
