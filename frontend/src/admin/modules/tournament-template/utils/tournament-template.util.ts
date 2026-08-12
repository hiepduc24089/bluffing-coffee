import type {
  TournamentTemplateLevelFormValues,
  TournamentTypeValue,
} from '@/admin/modules/tournament-template/types/tournament-template.type';

export const tournamentTypeOptions: Array<{
  label: string;
  value: TournamentTypeValue;
}> = [
  { label: 'Thường', value: 'normal' },
  { label: 'DeepStack', value: 'deepstack' },
  { label: 'Turbo', value: 'turbo' },
  { label: 'Sit & Go', value: 'sitngo' },
];

export function getTournamentTypeLabel(value: TournamentTypeValue) {
  return tournamentTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function formatDuration(totalMinutes: number) {
  if (!totalMinutes) return '0 phút';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} phút`;
  if (!minutes) return `${hours} giờ`;

  return `${hours} giờ ${minutes} phút`;
}

export function formatChips(value?: number | null) {
  return (value ?? 0).toLocaleString('vi-VN');
}

export function formatCurrency(value?: number | null) {
  return `${(value ?? 0).toLocaleString('vi-VN')}đ`;
}

/**
 * Breaks do not consume a blind level number, so numbering is derived from the
 * ordered rows instead of being typed in by staff.
 */
export function withDerivedLevelNumbers(
  levels: TournamentTemplateLevelFormValues[],
): TournamentTemplateLevelFormValues[] {
  let levelNumber = 0;

  return levels.map((level) => {
    if (level.isBreak) {
      return { ...level, levelNumber: null };
    }

    levelNumber += 1;

    return { ...level, levelNumber };
  });
}

export function sumLevelDuration(levels: Array<{ durationMinutes?: number | null }> = []) {
  return levels.reduce((total, level) => total + Number(level?.durationMinutes ?? 0), 0);
}
