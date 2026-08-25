import { Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminPermissions } from '@/admin/modules/auth/hooks/use-admin-permissions';

/**
 * Thứ tự phải khớp với thứ tự menu: nhân viên thiếu quyền vào trang đang mở sẽ
 * được đẩy về trang đầu tiên họ xem được, thay vì rơi vào màn trắng.
 */
const FALLBACK_ROUTES: Array<{ permission: string; path: string }> = [
  { permission: 'dashboard.view', path: '/admin/dashboard' },
  { permission: 'user.view', path: '/admin/users' },
  { permission: 'tournament_template.view', path: '/admin/tournament-templates' },
  { permission: 'tournament.view', path: '/admin/tournaments' },
  { permission: 'tournament_registration.view', path: '/admin/tournament-registrations' },
  { permission: 'badge.view', path: '/admin/badges' },
  { permission: 'leaderboard.view', path: '/admin/leaderboard' },
  { permission: 'live_table.view', path: '/admin/live-tables/green' },
  { permission: 'schedule.view', path: '/admin/schedule' },
  { permission: 'payroll.view', path: '/admin/payroll' },
  { permission: 'special.manage_staff', path: '/admin/staff' },
  { permission: 'setting.view', path: '/admin/settings/posts' },
];

type RequirePermissionProps = {
  permission: string;
};

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { can, isLoading } = useAdminPermissions();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <Spin />
      </div>
    );
  }

  if (can(permission)) {
    return <Outlet />;
  }

  const fallback = FALLBACK_ROUTES.find((route) => can(route.permission));

  if (!fallback) {
    return <Navigate to="/admin/no-access" replace />;
  }

  return <Navigate to={fallback.path} replace />;
}
