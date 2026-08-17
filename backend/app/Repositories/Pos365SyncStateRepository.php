<?php

namespace App\Repositories;

use App\Models\Pos365SyncState;

class Pos365SyncStateRepository
{
    public const PARTNERS = 'partners';

    public function find(string $key): Pos365SyncState
    {
        return Pos365SyncState::query()->firstOrCreate(['key' => $key]);
    }

    public function cursor(string $key): ?string
    {
        return $this->find($key)->cursor;
    }

    public function markRunning(string $key): void
    {
        $this->find($key)->update(['last_run_at' => now()]);
    }

    /**
     * Con trỏ chỉ được đẩy lên SAU khi cả lô đã xử lý xong. Đẩy sớm mà lô lỗi
     * giữa chừng thì phần chưa xử lý biến mất vĩnh viễn — POS365 không có cách
     * nào lấy lại khoảng đã trôi qua.
     */
    public function markSuccess(string $key, ?string $cursor): void
    {
        $this->find($key)->update([
            'cursor' => $cursor,
            'last_success_at' => now(),
            'last_error' => null,
        ]);
    }

    public function markFailure(string $key, string $error): void
    {
        $this->find($key)->update(['last_error' => mb_substr($error, 0, 2000)]);
    }

    public function resetCursor(string $key): void
    {
        $this->find($key)->update(['cursor' => null]);
    }
}
