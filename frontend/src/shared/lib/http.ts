import axios, { AxiosError } from 'axios';
import { API_TOAST_EVENT, NETWORK_ERROR_EVENT, SERVER_ERROR_EVENT } from '@/shared/hooks/use-app-toast';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

type ApiResponseBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

function dispatchApiToast(type: 'success' | 'error', message: string) {
  if (typeof window === 'undefined' || !message) return;

  window.dispatchEvent(
    new CustomEvent(API_TOAST_EVENT, {
      detail: {
        type,
        message,
      },
    }),
  );
}

function getFirstValidationError(errors?: Record<string, string[]>) {
  if (!errors) return null;

  return Object.values(errors).find((messages) => messages.length > 0)?.[0] ?? null;
}

function getErrorMessage(error: AxiosError<ApiResponseBody>) {
  const data = error.response?.data;
  return getFirstValidationError(data?.errors) ?? data?.message ?? error.message;
}

http.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    const message = (response.data as ApiResponseBody | undefined)?.message;

    if (message && method && method !== 'get') {
      dispatchApiToast('success', message);
    }

    return response;
  },
  (error: AxiosError<ApiResponseBody>) => {
    if (!error.response) {
      window.dispatchEvent(new Event(NETWORK_ERROR_EVENT));
      dispatchApiToast('error', 'Không thể kết nối đến máy chủ.');
      return Promise.reject(error);
    }

    if (error.response.status >= 500) {
      window.dispatchEvent(new Event(SERVER_ERROR_EVENT));
    }

    dispatchApiToast('error', getErrorMessage(error));
    return Promise.reject(error);
  },
);
