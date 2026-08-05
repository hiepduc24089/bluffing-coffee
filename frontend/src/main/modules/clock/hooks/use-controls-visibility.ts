import { useEffect, useRef, useState } from 'react';

const IDLE_MS = 5000;

/**
 * On a venue TV nobody touches the screen, so the controls fade out and the
 * blinds get the whole display. Any pointer/key activity brings them back.
 */
export function useControlsVisibility(enabled: boolean) {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    const scheduleHide = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setIsVisible(false), IDLE_MS);
    };

    const handleActivity = () => {
      setIsVisible(true);
      scheduleHide();
    };

    scheduleHide();

    window.addEventListener('pointermove', handleActivity);
    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      window.removeEventListener('pointermove', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [enabled]);

  return isVisible;
}
