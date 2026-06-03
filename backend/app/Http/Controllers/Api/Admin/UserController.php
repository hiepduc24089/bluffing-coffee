<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Requests\User\UserIndexRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function index(UserIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $search = $validated['search'] ?? null;

        $users = User::query()
            ->where('role', UserRoleEnum::Member->value)
            ->when($search, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate((int) ($validated['per_page'] ?? 10));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): UserResource
    {
        $validated = $request->validated();

        $user = User::query()->create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'role' => UserRoleEnum::Member,
            'password' => $validated['phone'],
        ]);

        return UserResource::make($user);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user->update($request->validated());

        return UserResource::make($user);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function resetPassword(User $user): JsonResponse
    {
        $user->update([
            'password' => $user->phone,
        ]);

        return response()->json([
            'message' => 'Password has been reset to the user phone number.',
        ]);
    }
}
