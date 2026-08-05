import type { ClockGameFormat, ClockLevel } from '@/main/modules/clock/types/clock.type';
import {
  describeLevel,
  formatChips,
  formatCountdown,
  formatDuration,
  remainingFormatMinutes,
} from '@/main/modules/clock/utils/clock.util';

type ClockDisplayProps = {
  gameFormat: ClockGameFormat;
  currentLevel: ClockLevel | null;
  nextLevel: ClockLevel | null;
  levelIndex: number;
  remainingMs: number;
  progress: number;
  isRunning: boolean;
};

export function ClockDisplay({
  gameFormat,
  currentLevel,
  nextLevel,
  levelIndex,
  remainingMs,
  progress,
  isRunning,
}: ClockDisplayProps) {
  const isBreak = Boolean(currentLevel?.isBreak);
  const isEndingSoon = remainingMs > 0 && remainingMs <= 60_000;
  const accent = isBreak ? 'text-amber-300' : 'text-emerald-300';
  const minutesLeftInFormat = remainingFormatMinutes(gameFormat.levels, levelIndex + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-between gap-[2vh] text-center">
      <header className="flex w-full flex-wrap items-baseline justify-between gap-2">
        <span className="text-[clamp(0.95rem,2.2vw,2rem)] font-semibold tracking-wide text-slate-200">
          {gameFormat.name}
        </span>
        <span className="text-[clamp(0.8rem,1.8vw,1.6rem)] font-medium text-slate-400">
          {isBreak
            ? 'Giải lao'
            : `Level ${currentLevel?.levelNumber ?? '-'} / ${gameFormat.levelCount}`}
        </span>
      </header>

      <div className="flex flex-col items-center gap-[1vh]">
        <span
          className={`text-[clamp(0.85rem,2.4vw,2rem)] font-semibold uppercase tracking-[0.3em] ${accent}`}
        >
          {isBreak ? 'Nghỉ giải lao' : 'Small / Big blind'}
        </span>

        {isBreak ? null : (
          <span className="text-[clamp(2rem,9vw,7rem)] font-bold leading-none tabular-nums text-white">
            {formatChips(currentLevel?.smallBlind)} / {formatChips(currentLevel?.bigBlind)}
          </span>
        )}

        {!isBreak && currentLevel?.ante ? (
          <span className="text-[clamp(1rem,3vw,2.4rem)] font-medium tabular-nums text-slate-300">
            Ante {formatChips(currentLevel.ante)}
          </span>
        ) : null}
      </div>

      <div className="flex w-full flex-col items-center gap-[1.5vh]">
        <span
          className={`text-[clamp(4rem,24vw,20rem)] font-bold leading-[0.9] tabular-nums transition-colors ${
            isEndingSoon ? 'text-rose-400' : 'text-white'
          } ${isEndingSoon && isRunning ? 'animate-pulse' : ''}`}
        >
          {formatCountdown(remainingMs)}
        </span>

        <div className="h-[0.9vh] min-h-[6px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              isBreak ? 'bg-amber-300' : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <footer className="flex w-full flex-col items-center gap-[0.6vh] text-slate-300">
        <span className="text-[clamp(0.95rem,2.6vw,2.2rem)] font-medium">
          Tiếp theo: <span className="text-white">{describeLevel(nextLevel)}</span>
        </span>
        <span className="text-[clamp(0.7rem,1.6vw,1.3rem)] text-slate-400">
          Stack {formatChips(gameFormat.startingStack)}
          {gameFormat.lateRegUntilLevel
            ? ` · Late reg hết level ${gameFormat.lateRegUntilLevel}`
            : ' · Late reg không giới hạn'}
          {minutesLeftInFormat ? ` · Còn khoảng ${formatDuration(minutesLeftInFormat)}` : ''}
        </span>
      </footer>
    </div>
  );
}
