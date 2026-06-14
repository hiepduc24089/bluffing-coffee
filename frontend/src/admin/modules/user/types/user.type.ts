import type { BadgeRow } from '@/admin/modules/badge/types/badge.type';
import type { BpTransactionRow, TournamentRegistrationRow } from '@/admin/modules/tournament/types/tournament.type';

export type UserRow = {
  id: string;
  name: string;
  phone: string;
  role: string;
  bpBalance: number;
  rankLevel?: string | null;
  statistic?: UserStatistic | null;
  badges?: BadgeRow[];
  createdAt: string;
};

export type UserStatistic = {
  totalBpEarned: number;
  tournamentsPlayed: number;
  championshipsWon: number;
  sitngoWins: number;
  turboWins: number;
  deepstackWins: number;
  lastPlayedAt?: string | null;
};

export type UserDetail = UserRow & {
  statistic?: UserStatistic | null;
  badges: BadgeRow[];
  bpTransactions: BpTransactionRow[];
  tournamentRegistrations: TournamentRegistrationRow[];
};

export type UserFilter = {
  keyword: string;
  page: number;
  perPage: number;
};

export type UserFormValues = {
  name: string;
  phone: string;
};
