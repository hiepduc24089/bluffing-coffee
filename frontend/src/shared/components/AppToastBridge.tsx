import { useEffect } from 'react';
import { API_TOAST_EVENT, useAppToast } from '@/shared/hooks/use-app-toast';
import type { ToastType } from '@/shared/components/atoms/AppToastContent';

type ApiToastEventDetail = {
  type: ToastType;
  message: string;
};

export function AppToastBridge() {
  const toast = useAppToast();

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ApiToastEventDetail>).detail;

      if (!detail?.message) return;

      toast[detail.type](detail.message, { bypassSuppression: true });
    };

    window.addEventListener(API_TOAST_EVENT, handleToast);
    return () => window.removeEventListener(API_TOAST_EVENT, handleToast);
  }, [toast]);

  return null;
}
