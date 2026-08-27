import type { BadgeRow } from '@/admin/modules/badge/types/badge.type';
import type { BpTransactionRow, TournamentRegistrationRow } from '@/admin/modules/tournament/types/tournament.type';

export type UserRow = {
  id: string;
  name: string;
  phone: string;
  role: string;
  bpBalance: number;
  rankLevel?: string | null;
  isClaimed: boolean;
  claimedAt?: string | null;
  lastSeenAt?: string | null;
  fromPos365?: boolean;
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

/**
 * `recent` xếp theo lần gần nhất thành viên có mặt ở quán — dùng cho ô chọn
 * người chơi ở quầy. `latest` xếp theo ngày tạo, giữ nguyên cho màn quản lý.
 */
export type UserSort = 'latest' | 'recent';

export type UserFilter = {
  keyword: string;
  page: number;
  perPage: number;
  sort?: UserSort;
};

export type UserFormValues = {
  name: string;
  phone: string;
};
