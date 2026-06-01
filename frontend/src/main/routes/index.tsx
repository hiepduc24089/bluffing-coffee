import { Navigate, type RouteObject } from 'react-router-dom';
import { MainLoginPage } from '@/main/modules/auth/pages/MainLoginPage';

export const mainRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <MainLoginPage />,
  },
];
