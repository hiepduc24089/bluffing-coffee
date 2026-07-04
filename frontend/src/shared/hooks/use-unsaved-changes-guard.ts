import { useCallback, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export const UNSAVED_CHANGES_MESSAGE = 'Các thay đổi chưa được lưu, có muốn tiếp tục?';

type UseUnsavedChangesGuardOptions = {
  enabled: boolean;
  message?: string;
};

export function stableSerialize(value: unknown): string {
  return JSON.stringify(normalizeValue(value));
}

export function useUnsavedChangesGuard({
  enabled,
  message = UNSAVED_CHANGES_MESSAGE,
}: UseUnsavedChangesGuardOptions) {
  const blocker = useBlocker(enabled);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, message]);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;

    if (window.confirm(message)) {
      blocker.proceed();
      return;
    }

    blocker.reset();
  }, [blocker, message]);

  return useCallback(
    (action: () => void) => {
      if (!enabled || window.confirm(message)) {
        action();
      }
    },
    [enabled, message],
  );
}

function normalizeValue(value: unknown): unknown {
  if (value == null) return null;

  if (typeof value !== 'object') return value;

  if (isDayjsLike(value)) {
    return value.format('YYYY-MM-DD HH:mm');
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  const normalized: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>)
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .forEach(([key, entry]) => {
      normalized[key] = normalizeValue(entry);
    });

  return normalized;
}

function isDayjsLike(value: unknown): value is { format: (format?: string) => string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'format' in value &&
    typeof (value as { format?: unknown }).format === 'function'
  );
}
