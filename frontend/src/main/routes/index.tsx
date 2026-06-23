import { type RouteObject } from 'react-router-dom';
import { RequireMainAuth } from '@/main/modules/auth/components/require-main-auth';
import { MainLoginPage } from '@/main/modules/auth/pages/MainLoginPage';
import { CheckInPage } from '@/main/modules/check-in/pages/CheckInPage';
import { HomePage } from '@/main/modules/home/pages/HomePage';

export const mainRoutes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <MainLoginPage />,
  },
  {
    element: <RequireMainAuth />,
    children: [
      {
        path: '/check-in',
        element: <CheckInPage />,
      },
    ],
  },
];
