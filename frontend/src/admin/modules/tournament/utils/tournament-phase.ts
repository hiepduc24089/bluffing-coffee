import type { TournamentPhase } from '@/admin/modules/tournament/types/tournament.type';

/**
 * Giai đoạn của giải do backend suy ra từ giờ bắt đầu và thời điểm chốt thưởng,
 * nên đây chỉ là nhãn hiển thị — không có chỗ nào cho chọn tay.
 */
export const tournamentPhaseColors: Record<TournamentPhase, string> = {
  upcoming: 'blue',
  running: 'green',
  completed: 'gold',
};

export const tournamentPhaseLabels: Record<TournamentPhase, string> = {
  upcoming: 'Sắp diễn ra',
  running: 'Đang diễn ra',
  completed: 'Đã hoàn tất',
};

export const tournamentPhaseOptions = (
  Object.keys(tournamentPhaseLabels) as TournamentPhase[]
).map((phase) => ({ label: tournamentPhaseLabels[phase], value: phase }));
