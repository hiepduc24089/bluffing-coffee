import { useEffect } from 'react';
import { appRouter } from '@/routes';

const MAIN_TITLE = 'Bluffing Coffee';
const ADMIN_TITLE = 'Bluffing Coffee Admin';

function resolveTitle(pathname: string): string {
  return pathname.startsWith('/admin') ? ADMIN_TITLE : MAIN_TITLE;
}

/**
 * Keeps the browser tab title in sync with the active area: admin routes carry
 * the admin suffix, every main-facing page stays on the plain brand name.
 * Subscribes to the router directly so it can run above `RouterProvider`.
 */
export function useDocumentTitle(): void {
  useEffect(() => {
    document.title = resolveTitle(appRouter.state.location.pathname);

    return appRouter.subscribe((state) => {
      document.title = resolveTitle(state.location.pathname);
    });
  }, []);
}
