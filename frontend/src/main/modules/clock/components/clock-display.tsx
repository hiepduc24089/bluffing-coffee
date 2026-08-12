import { ClockBrandMark } from '@/main/modules/clock/components/clock-brand-mark';
import type { ClockTournamentTemplate, ClockLevel } from '@/main/modules/clock/types/clock.type';
import {
  describeLevel,
  formatChips,
  formatCountdown,
  formatDuration,
  remainingFormatMinutes,
} from '@/main/modules/clock/utils/clock.util';

type ClockDisplayProps = {
  tournamentTemplate: ClockTournamentTemplate;
  currentLevel: ClockLevel | null;
  nextLevel: ClockLevel | null;
  levelIndex: number;
  remainingMs: number;
  progress: number;
  isRunning: boolean;
};

export function ClockDisplay({
  tournamentTemplate,
  currentLevel,
  nextLevel,
  levelIndex,
  remainingMs,
  progress,
  isRunning,
}: ClockDisplayProps) {
  const isBreak = Boolean(currentLevel?.isBreak);
  const isEndingSoon = remainingMs > 0 && remainingMs <= 60_000;
  const minutesLeftInFormat = remainingFormatMinutes(tournamentTemplate.levels, levelIndex + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-between gap-[2vh] text-center">
      <header className="flex w-full flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-[clamp(0.5rem,1.4vw,1.2rem)]">
          <ClockBrandMark />
          <span className="text-[clamp(0.95rem,2.2vw,2rem)] font-semibold tracking-wide text-brand">
            {tournamentTemplate.name}
          </span>
        </span>
        <span className="text-[clamp(0.8rem,1.8vw,1.6rem)] font-medium text-neutral-400">
          {isBreak
            ? 'Giải lao'
            : `Level ${currentLevel?.levelNumber ?? '-'} / ${tournamentTemplate.levelCount}`}
        </span>
      </header>

      <div className="flex flex-col items-center gap-[1vh]">
        <span
          className={`text-[clamp(0.85rem,2.4vw,2rem)] font-semibold uppercase tracking-[0.3em] ${
            isBreak ? 'text-white' : 'text-brand'
          }`}
        >
          {isBreak ? 'Nghỉ giải lao' : 'Small / Big blind'}
        </span>

        {isBreak ? null : (
          <span className="text-[clamp(2rem,9vw,7rem)] font-bold leading-none tabular-nums text-white">
            {formatChips(currentLevel?.smallBlind)} / {formatChips(currentLevel?.bigBlind)}
          </span>
        )}

        {!isBreak && currentLevel?.ante ? (
          <span className="text-[clamp(1rem,3vw,2.4rem)] font-medium tabular-nums text-neutral-300">
            Ante {formatChips(currentLevel.ante)}
          </span>
        ) : null}
      </div>

      <div className="flex w-full flex-col items-center gap-[1.5vh]">
        <span
          className={`text-[clamp(4rem,24vw,20rem)] font-bold leading-[0.9] tabular-nums transition-colors ${
            isEndingSoon ? 'text-rose-400' : 'text-brand'
          } ${isEndingSoon && isRunning ? 'animate-pulse' : ''}`}
        >
          {formatCountdown(remainingMs)}
        </span>

        <div className="h-[0.9vh] min-h-[6px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              isBreak ? 'bg-white/70' : 'bg-brand'
            }`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <footer className="flex w-full flex-col items-center gap-[0.6vh] text-neutral-300">
        <span className="text-[clamp(0.95rem,2.6vw,2.2rem)] font-medium">
          Tiếp theo: <span className="text-white">{describeLevel(nextLevel)}</span>
        </span>
        <span className="text-[clamp(0.7rem,1.6vw,1.3rem)] text-neutral-400">
          Stack {formatChips(tournamentTemplate.startingStack)}
          {tournamentTemplate.lateRegUntilLevel
            ? ` · Late reg hết level ${tournamentTemplate.lateRegUntilLevel}`
            : ' · Late reg không giới hạn'}
          {minutesLeftInFormat ? ` · Còn khoảng ${formatDuration(minutesLeftInFormat)}` : ''}
        </span>
      </footer>
    </div>
  );
}
