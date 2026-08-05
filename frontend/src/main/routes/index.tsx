import { type RouteObject } from 'react-router-dom';
import { RequireMainAuth } from '@/main/modules/auth/components/require-main-auth';
import { MainLoginPage } from '@/main/modules/auth/pages/MainLoginPage';
import { CheckInPage } from '@/main/modules/check-in/pages/CheckInPage';
import { ClockIndexPage } from '@/main/modules/clock/pages/ClockIndexPage';
import { ClockPage } from '@/main/modules/clock/pages/ClockPage';
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
    path: '/clock',
    element: <ClockIndexPage />,
  },
  {
    path: '/clock/:code',
    element: <ClockPage />,
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
