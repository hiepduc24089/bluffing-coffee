import { Navigate, type RouteObject } from 'react-router-dom';
import { AdminLayout } from '@/admin/layouts/admin-layout';
import { BadgePage } from '@/admin/modules/badge/pages/BadgePage';
import { RequireAdminAuth } from '@/admin/modules/auth/components/require-admin-auth';
import { RequirePermission } from '@/admin/modules/auth/components/require-permission';
import { AdminLoginPage } from '@/admin/modules/auth/pages/AdminLoginPage';
import { NoAccessPage } from '@/admin/modules/auth/pages/NoAccessPage';
import { DashboardPage } from '@/admin/modules/dashboard/pages/DashboardPage';
import { TournamentTemplatePage } from '@/admin/modules/tournament-template/pages/TournamentTemplatePage';
import { LeaderboardPage } from '@/admin/modules/leaderboard/pages/LeaderboardPage';
import { LiveTablePage } from '@/admin/modules/live-table/pages/LiveTablePage';
import { BannerSettingPage } from '@/admin/modules/setting/pages/BannerSettingPage';
import { ContentPageSettingPage } from '@/admin/modules/setting/pages/ContentPageSettingPage';
import { StaffPage } from '@/admin/modules/staff/pages/StaffPage';
import { TournamentPage } from '@/admin/modules/tournament/pages/TournamentPage';
import { TournamentRegistrationPage } from '@/admin/modules/tournament/pages/TournamentRegistrationPage';
import { UserDetailPage } from '@/admin/modules/user/pages/UserDetailPage';
import { UserPage } from '@/admin/modules/user/pages/UserPage';

/**
 * Mỗi trang nằm dưới một route cha chỉ có nhiệm vụ kiểm tra quyền, để gõ thẳng
 * URL cũng bị chặn chứ không chỉ ẩn khỏi menu.
 */
function guarded(permission: string, children: RouteObject[]): RouteObject {
  return {
    element: <RequirePermission permission={permission} />,
    children,
  };
}

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <RequireAdminAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'no-access',
            element: <NoAccessPage />,
          },
          guarded('dashboard.view', [{ path: 'dashboard', element: <DashboardPage /> }]),
          guarded('tournament_template.view', [
            { path: 'tournament-templates', element: <TournamentTemplatePage /> },
          ]),
          guarded('tournament.view', [{ path: 'tournaments', element: <TournamentPage /> }]),
          guarded('tournament_registration.view', [
            { path: 'tournament-registrations', element: <TournamentRegistrationPage /> },
          ]),
          guarded('user.view', [
            { path: 'users', element: <UserPage /> },
            { path: 'users/:id', element: <UserDetailPage /> },
          ]),
          guarded('badge.view', [{ path: 'badges', element: <BadgePage /> }]),
          guarded('leaderboard.view', [{ path: 'leaderboard', element: <LeaderboardPage /> }]),
          guarded('live_table.view', [
            { path: 'live-tables/:tableKey', element: <LiveTablePage /> },
          ]),
          guarded('setting.view', [
            {
              path: 'settings/posts',
              element: (
                <ContentPageSettingPage
                  type="post"
                  title="Bài viết"
                  subtitle="Quản lý bài viết, tiêu đề, banner."
                />
              ),
            },
            {
              path: 'settings/banners',
              element: <BannerSettingPage />,
            },
            {
              path: 'settings/events',
              element: (
                <ContentPageSettingPage
                  type="event"
                  title="Sự kiện"
                  subtitle="Quản lý sự kiện, nội dung."
                />
              ),
            },
          ]),
          guarded('special.manage_staff', [{ path: 'settings/staff', element: <StaffPage /> }]),
        ],
      },
    ],
  },
];
