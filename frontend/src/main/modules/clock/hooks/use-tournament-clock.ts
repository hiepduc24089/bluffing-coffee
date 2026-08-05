import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClockLevel, ClockState } from '@/main/modules/clock/types/clock.type';
import { levelDurationMs } from '@/main/modules/clock/utils/clock.util';

const TICK_MS = 250;

function storageKey(code: string) {
  return `bluffing-clock:${code}`;
}

function buildInitialState(levels: ClockLevel[]): ClockState {
  return {
    levelIndex: 0,
    remainingMs: levelDurationMs(levels[0]),
    endsAt: null,
  };
}

function loadState(code: string, levels: ClockLevel[]): ClockState {
  if (typeof window === 'undefined') return buildInitialState(levels);

  try {
    const raw = window.localStorage.getItem(storageKey(code));
    if (!raw) return buildInitialState(levels);

    const parsed = JSON.parse(raw) as Partial<ClockState>;
    const levelIndex = Number(parsed.levelIndex ?? 0);

    if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= levels.length) {
      return buildInitialState(levels);
    }

    return {
      levelIndex,
      remainingMs: Math.max(0, Number(parsed.remainingMs ?? levelDurationMs(levels[levelIndex]))),
      endsAt: typeof parsed.endsAt === 'number' ? parsed.endsAt : null,
    };
  } catch {
    return buildInitialState(levels);
  }
}

/**
 * Two short beeps so the room notices a level change without watching the screen.
 * Runs off a user gesture (the operator pressing start), so autoplay policies allow it.
 */
function playLevelChangeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();

    [0, 0.35].forEach((offset) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, context.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.25);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + 0.3);
    });

    window.setTimeout(() => void context.close(), 1200);
  } catch {
    // Audio is a nice-to-have; never let it break the clock.
  }
}

export function useTournamentClock(code: string, levels: ClockLevel[]) {
  const [state, setState] = useState<ClockState>(() => loadState(code, levels));
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  // A different format means a different saved clock.
  useEffect(() => {
    setState(loadState(code, levels));
    setNow(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, levels.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(storageKey(code), JSON.stringify(state));
  }, [code, state]);

  const goToLevel = useCallback(
    (index: number, options?: { keepRunning?: boolean; announce?: boolean }) => {
      const boundedIndex = Math.min(Math.max(index, 0), Math.max(levels.length - 1, 0));
      const duration = levelDurationMs(levels[boundedIndex]);
      const keepRunning = options?.keepRunning ?? false;

      if (options?.announce) playLevelChangeSound();

      setState({
        levelIndex: boundedIndex,
        remainingMs: duration,
        endsAt: keepRunning ? Date.now() + duration : null,
      });
    },
    [levels],
  );

  const advance = useCallback(() => {
    const current = stateRef.current;
    const nextIndex = current.levelIndex + 1;

    if (nextIndex >= levels.length) {
      setState({ levelIndex: current.levelIndex, remainingMs: 0, endsAt: null });
      playLevelChangeSound();
      return;
    }

    goToLevel(nextIndex, { keepRunning: true, announce: true });
  }, [goToLevel, levels.length]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());

      const current = stateRef.current;

      if (current.endsAt !== null && Date.now() >= current.endsAt) {
        advance();
      }
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [advance]);

  const isRunning = state.endsAt !== null;
  const remainingMs = isRunning ? Math.max(0, (state.endsAt ?? 0) - now) : state.remainingMs;
  const currentLevel = levels[state.levelIndex] ?? null;
  const nextLevel = levels[state.levelIndex + 1] ?? null;
  const totalMs = levelDurationMs(currentLevel);
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;

  const start = useCallback(() => {
    setState((current) =>
      current.endsAt !== null
        ? current
        : { ...current, endsAt: Date.now() + Math.max(0, current.remainingMs) },
    );
  }, []);

  const pause = useCallback(() => {
    setState((current) =>
      current.endsAt === null
        ? current
        : {
            ...current,
            remainingMs: Math.max(0, current.endsAt - Date.now()),
            endsAt: null,
          },
    );
  }, []);

  const toggle = useCallback(() => {
    if (stateRef.current.endsAt !== null) {
      pause();
      return;
    }

    start();
  }, [pause, start]);

  const goNext = useCallback(() => {
    goToLevel(stateRef.current.levelIndex + 1, {
      keepRunning: stateRef.current.endsAt !== null,
    });
  }, [goToLevel]);

  const goPrevious = useCallback(() => {
    goToLevel(stateRef.current.levelIndex - 1, {
      keepRunning: stateRef.current.endsAt !== null,
    });
  }, [goToLevel]);

  const addMinutes = useCallback((minutes: number) => {
    setState((current) => {
      const delta = minutes * 60_000;

      if (current.endsAt !== null) {
        return { ...current, endsAt: Math.max(Date.now(), current.endsAt + delta) };
      }

      return { ...current, remainingMs: Math.max(0, current.remainingMs + delta) };
    });
  }, []);

  const reset = useCallback(() => {
    goToLevel(0);
  }, [goToLevel]);

  return {
    levelIndex: state.levelIndex,
    currentLevel,
    nextLevel,
    remainingMs,
    progress,
    isRunning,
    isFinished: state.levelIndex === levels.length - 1 && remainingMs <= 0 && !isRunning,
    start,
    pause,
    toggle,
    goNext,
    goPrevious,
    addMinutes,
    reset,
  };
}
