import { useEffect, useState } from 'react';

/**
 * Giữ lại giá trị cho tới khi người dùng ngừng gõ.
 *
 * Dùng cho những ô tìm kiếm bắn thẳng lên server: gõ "Nguyễn" mà không chặn thì
 * là sáu request, trong đó năm cái vừa rời khỏi mạng đã hết giá trị.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);

    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
