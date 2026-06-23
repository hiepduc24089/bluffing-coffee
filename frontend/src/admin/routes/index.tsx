import { Navigate, type RouteObject } from 'react-router-dom';
import { AdminLayout } from '@/admin/layouts/admin-layout';
import { BadgePage } from '@/admin/modules/badge/pages/BadgePage';
import { RequireAdminAuth } from '@/admin/modules/auth/components/require-admin-auth';
import { AdminLoginPage } from '@/admin/modules/auth/pages/AdminLoginPage';
import { DashboardPage } from '@/admin/modules/dashboard/pages/DashboardPage';
import { LeaderboardPage } from '@/admin/modules/leaderboard/pages/LeaderboardPage';
import { LiveTablePage } from '@/admin/modules/live-table/pages/LiveTablePage';
import { RewardProfilePage } from '@/admin/modules/tournament/pages/RewardProfilePage';
import { TournamentPage } from '@/admin/modules/tournament/pages/TournamentPage';
import { TournamentRegistrationPage } from '@/admin/modules/tournament/pages/TournamentRegistrationPage';
import { UserDetailPage } from '@/admin/modules/user/pages/UserDetailPage';
import { UserPage } from '@/admin/modules/user/pages/UserPage';

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
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'tournaments',
            element: <TournamentPage />,
          },
          {
            path: 'tournament-registrations',
            element: <TournamentRegistrationPage />,
          },
          {
            path: 'reward-profiles',
            element: <RewardProfilePage />,
          },
          {
            path: 'users',
            element: <UserPage />,
          },
          {
            path: 'users/:id',
            element: <UserDetailPage />,
          },
          {
            path: 'badges',
            element: <BadgePage />,
          },
          {
            path: 'leaderboard',
            element: <LeaderboardPage />,
          },
          {
            path: 'live-tables/:tableKey',
            element: <LiveTablePage />,
          },
        ],
      },
    ],
  },
];
