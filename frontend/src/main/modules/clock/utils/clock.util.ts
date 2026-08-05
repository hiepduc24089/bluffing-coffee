import type { ClockLevel } from '@/main/modules/clock/types/clock.type';

export function formatChips(value?: number | null) {
  return (value ?? 0).toLocaleString('vi-VN');
}

export function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(totalMinutes: number) {
  if (!totalMinutes) return '0 phút';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (!hours) return `${minutes} phút`;
  if (!minutes) return `${hours} giờ`;

  return `${hours} giờ ${minutes} phút`;
}

export function levelDurationMs(level?: ClockLevel | null) {
  return Math.max(0, Number(level?.durationMinutes ?? 0)) * 60_000;
}

export function describeLevel(level?: ClockLevel | null) {
  if (!level) return 'Kết thúc';
  if (level.isBreak) return `Nghỉ giải lao ${level.durationMinutes} phút`;

  const ante = level.ante ? ` (ante ${formatChips(level.ante)})` : '';

  return `${formatChips(level.smallBlind)} / ${formatChips(level.bigBlind)}${ante}`;
}

/**
 * Minutes still to play from a level onwards, used for the "còn lại" estimate.
 */
export function remainingFormatMinutes(levels: ClockLevel[], fromIndex: number) {
  return levels
    .slice(Math.max(0, fromIndex))
    .reduce((total, level) => total + Number(level.durationMinutes ?? 0), 0);
}
