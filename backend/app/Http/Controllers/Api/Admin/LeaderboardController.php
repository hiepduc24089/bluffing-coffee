<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class LeaderboardController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $validated = request()->validate([
            'type' => ['nullable', Rule::in([
                'bp_balance',
                'total_bp_earned',
                'championships_won',
                'tournaments_played',
            ])],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $type = $validated['type'] ?? 'bp_balance';
        $limit = (int) ($validated['limit'] ?? 20);

        $users = User::query()
            ->where('role', UserRoleEnum::Member->value)
            ->with(['statistic', 'badges'])
            ->when($type === 'bp_balance', fn ($query) => $query->orderByDesc('bp_balance'))
            ->when($type !== 'bp_balance', function ($query) use ($type) {
                $query
                    ->leftJoin('user_statistics', 'users.id', '=', 'user_statistics.user_id')
                    ->select('users.*')
                    ->orderByDesc("user_statistics.{$type}");
            })
            ->limit($limit)
            ->get();

        return UserResource::collection($users);
    }
}
