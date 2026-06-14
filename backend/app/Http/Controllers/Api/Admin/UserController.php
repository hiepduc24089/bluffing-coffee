<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\AttachUserBadgeRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Requests\User\UserIndexRequest;
use App\Http\Resources\BadgeResource;
use App\Http\Resources\BpTransactionResource;
use App\Http\Resources\TournamentRegistrationResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\UserStatisticResource;
use App\Models\Badge;
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

    public function show(User $user): JsonResponse
    {
        $user->load(['statistic', 'badges']);

        $bpTransactions = $user->bpTransactions()
            ->with('reference.tournament')
            ->latest('created_at')
            ->limit(10)
            ->get();

        $tournamentRegistrations = $user->tournamentRegistrations()
            ->with('tournament')
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                ...UserResource::make($user)->resolve(),
                'statistic' => $user->statistic
                    ? UserStatisticResource::make($user->statistic)->resolve()
                    : null,
                'badges' => BadgeResource::collection($user->badges)->resolve(),
                'bpTransactions' => BpTransactionResource::collection($bpTransactions)->resolve(),
                'tournamentRegistrations' => TournamentRegistrationResource::collection($tournamentRegistrations)->resolve(),
            ],
        ]);
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
            'message' => 'Đã reset mật khẩu về số điện thoại của thành viên.',
        ]);
    }

    public function attachBadge(AttachUserBadgeRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        $user->badges()->syncWithoutDetaching([
            $validated['badgeId'] => ['earned_at' => now()],
        ]);

        return response()->json([
            'data' => BadgeResource::collection($user->badges()->get())->resolve(),
        ]);
    }

    public function detachBadge(User $user, Badge $badge): JsonResponse
    {
        $user->badges()->detach($badge->id);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
