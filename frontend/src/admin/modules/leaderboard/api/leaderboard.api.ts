import { http } from '@/shared/lib/http';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type { UserRow } from '@/admin/modules/user/types/user.type';

export type LeaderboardType =
  | 'bp_balance'
  | 'total_bp_earned'
  | 'championships_won'
  | 'tournaments_played';

export const leaderboardQueryKeys = {
  all: ['leaderboard'] as const,
  list: (type: LeaderboardType) => [...leaderboardQueryKeys.all, type] as const,
};

export async function getLeaderboard(type: LeaderboardType): Promise<UserRow[]> {
  const response = await http.get<{ data: UserRow[] }>('/admin/leaderboard', {
    headers: getAdminAuthHeaders(),
    params: {
      type,
      limit: 50,
    },
  });

  return response.data.data;
}
