import { RouterProvider } from 'react-router-dom';
import { appRouter } from '@/routes';
import { AppToastBridge } from '@/shared/components/AppToastBridge';

export default function App() {
  return (
    <>
      <AppToastBridge />
      <RouterProvider router={appRouter} />
    </>
  );
}
