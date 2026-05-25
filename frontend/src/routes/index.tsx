import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/admin-layout';
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage';
import { TournamentPage } from '@/modules/tournament/pages/TournamentPage';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'tournaments',
        element: <TournamentPage />,
      },
    ],
  },
]);
