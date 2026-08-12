import type { TournamentPhase } from '@/admin/modules/tournament/types/tournament.type';

export type DashboardStats = {
  activeLiveTables: number;
  openTournaments: number;
  activeRegistrations: number;
  totalMembers: number;
};

export type DashboardActivityRow = {
  id: string;
  name: string;
  phase: TournamentPhase;
  startAt: string | null;
  capacity: number | null;
  registeredCount: number;
  tables: string[];
};

export type DashboardSummary = {
  stats: DashboardStats;
  recentTournaments: DashboardActivityRow[];
};
