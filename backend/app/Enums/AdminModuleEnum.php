<?php

namespace App\Enums;

enum AdminModuleEnum: string
{
    case Dashboard = 'dashboard';
    case User = 'user';
    case TournamentTemplate = 'tournament_template';
    case Tournament = 'tournament';
    case TournamentRegistration = 'tournament_registration';
    case Badge = 'badge';
    case Leaderboard = 'leaderboard';
    case LiveTable = 'live_table';
    case Setting = 'setting';

    public function label(): string
    {
        return match ($this) {
            self::Dashboard => 'Tổng quan',
            self::User => 'Thành viên',
            self::TournamentTemplate => 'Mẫu giải đấu',
            self::Tournament => 'Giải đấu',
            self::TournamentRegistration => 'Đăng ký giải',
            self::Badge => 'Huy hiệu',
            self::Leaderboard => 'Leaderboard',
            self::LiveTable => 'Live Table',
            self::Setting => 'Setting',
        };
    }

    /**
     * Không phải module nào cũng có đủ bốn action: màn báo cáo chỉ đọc, và Live
     * Table thì không tạo/xóa bàn mà chỉ thao tác trên bàn có sẵn.
     *
     * @return array<int, AdminActionEnum>
     */
    public function actions(): array
    {
        return match ($this) {
            self::Dashboard, self::Leaderboard => [AdminActionEnum::View],
            self::LiveTable => [AdminActionEnum::View, AdminActionEnum::Update],
            default => AdminActionEnum::cases(),
        };
    }

    public function permission(AdminActionEnum $action): string
    {
        return $this->value.'.'.$action->value;
    }

    /**
     * @return array<int, string>
     */
    public function permissions(): array
    {
        return array_map(
            fn (AdminActionEnum $action) => $this->permission($action),
            $this->actions(),
        );
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
