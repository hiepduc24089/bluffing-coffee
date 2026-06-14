import React from 'react';
import { App as AntdApp } from 'antd';
import AppToastContent, { type ToastType } from '@/shared/components/atoms/AppToastContent';

const DEFAULT_DURATION = 4;
const PLACEMENT = 'topRight' as const;

export interface ToastOptions {
  duration?: number;
  key?: string;
  bypassSuppression?: boolean;
  style?: React.CSSProperties;
}

let globalNetworkErrorSuppressed = false;
let globalServerErrorSuppressed = false;

export const NETWORK_ERROR_EVENT = 'app-network-error';
export const SERVER_ERROR_EVENT = 'app-server-error';
export const API_TOAST_EVENT = 'app-api-toast';

if (typeof window !== 'undefined') {
  window.addEventListener(NETWORK_ERROR_EVENT, () => {
    globalNetworkErrorSuppressed = true;
    setTimeout(() => {
      globalNetworkErrorSuppressed = false;
    }, 500);
  });
  window.addEventListener(SERVER_ERROR_EVENT, () => {
    globalServerErrorSuppressed = true;
    setTimeout(() => {
      globalServerErrorSuppressed = false;
    }, 500);
  });
}

export interface ToastMethods {
  info: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
}

export const useAppToast = (): ToastMethods => {
  const { notification } = AntdApp.useApp();

  const openToast = (type: ToastType, message: string, options: ToastOptions = {}) => {
    if ((globalNetworkErrorSuppressed || globalServerErrorSuppressed) && !options.bypassSuppression) {
      return;
    }

    const { duration = DEFAULT_DURATION, key } = options;
    const content = React.createElement(AppToastContent, { type, message, showIcon: true });

    notification.open({
      key: key ?? `toast-${type}-${Date.now()}`,
      message: content,
      placement: PLACEMENT,
      duration,
      icon: null,
      closeIcon: null,
      className: `app-toast-notice app-toast-notice--${type}`,
      ...(options.style ? { style: options.style } : {}),
    });
  };

  return {
    info: (message: string, options?: ToastOptions) => openToast('info', message, options),
    success: (message: string, options?: ToastOptions) => openToast('success', message, options),
    warning: (message: string, options?: ToastOptions) => openToast('warning', message, options),
    error: (message: string, options?: ToastOptions) => openToast('error', message, options),
  };
};

export default useAppToast;
