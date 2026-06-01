import { createBrowserRouter } from 'react-router-dom';
import { adminRoutes } from '@/admin/routes';
import { mainRoutes } from '@/main/routes';

export const appRouter = createBrowserRouter([
  ...mainRoutes,
  ...adminRoutes,
]);
