<?php

namespace App\Repositories;

use App\Models\Tournament;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TournamentRepository
{
    public function paginate(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return Tournament::query()
            ->when($search, function ($query, string $search) {
                $query->where('name', 'like', '%'.$search.'%');
            })
            ->when($status, function ($query, string $status) {
                $query->where('status', $status);
            })
            ->orderByDesc('start_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): Tournament
    {
        return Tournament::query()->create($payload);
    }

    public function update(Tournament $tournament, array $payload): Tournament
    {
        $tournament->update($payload);

        return $tournament->refresh();
    }

    public function delete(Tournament $tournament): void
    {
        $tournament->delete();
    }
}
