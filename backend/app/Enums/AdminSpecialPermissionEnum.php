<?php

namespace App\Enums;

/**
 * Các thao tác đụng thẳng vào tiền, điểm hoặc tài khoản người khác. Tách khỏi
 * ma trận module × action để nhân viên quầy có thể sửa giải đấu mà vẫn không
 * tự cộng BP hay đổi mật khẩu thành viên được.
 */
enum AdminSpecialPermissionEnum: string
{
    case FinalizeTournamentRewards = 'special.finalize_rewards';
    case AdjustBp = 'special.adjust_bp';
    case ResetMemberPassword = 'special.reset_member_password';
    case ManageStaff = 'special.manage_staff';

    public function label(): string
    {
        return match ($this) {
            self::FinalizeTournamentRewards => 'Chốt thưởng giải đấu',
            self::AdjustBp => 'Cộng / trừ BP thủ công',
            self::ResetMemberPassword => 'Reset mật khẩu thành viên',
            self::ManageStaff => 'Quản lý nhân viên',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
