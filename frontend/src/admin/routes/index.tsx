import { Navigate, type RouteObject } from 'react-router-dom';
import { AdminLayout } from '@/admin/layouts/admin-layout';
import { RequireAdminAuth } from '@/admin/modules/auth/components/require-admin-auth';
import { AdminLoginPage } from '@/admin/modules/auth/pages/AdminLoginPage';
import { DashboardPage } from '@/admin/modules/dashboard/pages/DashboardPage';
import { TournamentPage } from '@/admin/modules/tournament/pages/TournamentPage';
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
            path: 'users',
            element: <UserPage />,
          },
        ],
      },
    ],
  },
];
