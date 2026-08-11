import type { TournamentStatus } from '@/admin/modules/tournament/types/tournament.type';

export const tournamentStatusColors: Record<TournamentStatus, string> = {
  draft: 'default',
  published: 'blue',
  running: 'green',
  completed: 'gold',
};

export const tournamentStatusLabels: Record<TournamentStatus, string> = {
  draft: 'Bản nháp',
  published: 'Đã công bố',
  running: 'Đang diễn ra',
  completed: 'Đã hoàn tất',
};
