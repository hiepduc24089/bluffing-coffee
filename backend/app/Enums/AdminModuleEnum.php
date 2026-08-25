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
    case Pos365 = 'pos365';
    case Schedule = 'schedule';
    case Payroll = 'payroll';
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
            self::Pos365 => 'Đối soát POS365',
            self::Schedule => 'Lịch làm việc',
            self::Payroll => 'Bảng lương',
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
            // Bản ghi POS365 do bên kia sinh ra, bên mình không tạo cũng không
            // xoá — chỉ xem hàng đợi và quyết định gắn vào ai. Bảng lương cũng
            // vậy: số liệu sinh ra từ lịch, chỉ sửa được mức lương giờ.
            self::LiveTable, self::Pos365, self::Payroll => [AdminActionEnum::View, AdminActionEnum::Update],
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
