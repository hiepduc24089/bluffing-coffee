import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  TournamentFilter,
  TournamentFormValues,
  TournamentRow,
  RewardProfile,
  TournamentRegistrationRow,
  TournamentRegistrationStatus,
  BpTransactionRow,
  RewardProfileFormValues,
  TournamentRewardPreviewRow,
} from '@/admin/modules/tournament/types/tournament.type';

const mockRows: TournamentRow[] = [
  {
    id: 'tour-001',
    name: 'Giải tối thứ sáu',
    tournamentType: 'normal',
    buyIn: 150000,
    ticketPriceWithDrink: 85000,
    ticketPriceWithoutDrink: 60000,
    capacity: 60,
    status: 'published',
    rewardProfileId: null,
    startAt: '2026-05-16 19:00',
  },
  {
    id: 'tour-002',
    name: 'Giải chủ nhật',
    tournamentType: 'normal',
    buyIn: 500000,
    ticketPriceWithDrink: 85000,
    ticketPriceWithoutDrink: 60000,
    capacity: 120,
    status: 'draft',
    rewardProfileId: null,
    startAt: '2026-05-18 14:00',
  },
];

export const tournamentQueryKeys = {
  all: ['tournaments'] as const,
  list: (filters: TournamentFilter) => [...tournamentQueryKeys.all, filters] as const,
  rewardProfiles: ['reward-profiles'] as const,
};

export async function getTournamentList(
  filters: TournamentFilter,
): Promise<PaginatedResponse<TournamentRow>> {
  try {
    const response = await http.get<PaginatedResponse<TournamentRow>>('/admin/tournaments', {
      headers: getAdminAuthHeaders(),
      params: {
        search: filters.keyword || undefined,
        status: filters.status,
        page: filters.page,
        per_page: filters.perPage,
      },
    });

    return response.data;
  } catch {
    const filteredRows = mockRows.filter((row) => {
      const matchesKeyword =
        !filters.keyword ||
        row.name.toLowerCase().includes(filters.keyword.toLowerCase());
      const matchesStatus = !filters.status || row.status === filters.status;

      return matchesKeyword && matchesStatus;
    });

    return {
      data: filteredRows,
      meta: {
        current_page: filters.page,
        last_page: 1,
        per_page: filters.perPage,
        total: filteredRows.length,
      },
    };
  }
}

export async function createTournament(payload: TournamentFormValues) {
  return http.post('/admin/tournaments', payload, {
    headers: getAdminAuthHeaders(),
  });
}

export async function updateTournament(id: string, payload: TournamentFormValues) {
  return http.put(`/admin/tournaments/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });
}

export async function getRewardProfiles(): Promise<RewardProfile[]> {
  const response = await http.get<{ data: RewardProfile[] }>('/admin/reward-profiles', {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function createRewardProfile(payload: RewardProfileFormValues): Promise<RewardProfile> {
  const response = await http.post<{ data: RewardProfile }>('/admin/reward-profiles', payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateRewardProfile(
  id: number,
  payload: RewardProfileFormValues,
): Promise<RewardProfile> {
  const response = await http.put<{ data: RewardProfile }>(`/admin/reward-profiles/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function deleteRewardProfile(id: number): Promise<void> {
  await http.delete(`/admin/reward-profiles/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function getTournamentRegistrations(
  tournamentId: string,
): Promise<TournamentRegistrationRow[]> {
  const response = await http.get<{ data: TournamentRegistrationRow[] }>(
    `/admin/tournaments/${tournamentId}/registrations`,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function createTournamentRegistration(
  tournamentId: string,
  userId: number,
  entryType: 'with_drink' | 'without_drink',
) {
  const response = await http.post<{ data: TournamentRegistrationRow }>(
    `/admin/tournaments/${tournamentId}/registrations`,
    { userId, entryType },
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function updateTournamentRegistration(
  registrationId: number,
  payload: {
    status?: TournamentRegistrationStatus;
    finalPosition?: number | null;
  },
) {
  const response = await http.put<{ data: TournamentRegistrationRow }>(
    `/admin/tournament-registrations/${registrationId}`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function deleteTournamentRegistration(registrationId: number): Promise<void> {
  await http.delete(`/admin/tournament-registrations/${registrationId}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function finalizeTournamentRewards(tournamentId: string): Promise<void> {
  await http.post(`/admin/tournaments/${tournamentId}/finalize-rewards`, null, {
    headers: getAdminAuthHeaders(),
  });
}

export async function getTournamentRewardPreview(
  tournamentId: string,
): Promise<TournamentRewardPreviewRow[]> {
  const response = await http.get<{ data: TournamentRewardPreviewRow[] }>(
    `/admin/tournaments/${tournamentId}/reward-preview`,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function getTournamentBpTransactions(tournamentId: string): Promise<BpTransactionRow[]> {
  const response = await http.get<{ data: BpTransactionRow[] }>(
    `/admin/tournaments/${tournamentId}/bp-transactions`,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function updateBpTransaction(
  transactionId: number,
  payload: {
    amount: number;
    note?: string | null;
  },
): Promise<BpTransactionRow> {
  const response = await http.put<{ data: BpTransactionRow }>(
    `/admin/bp-transactions/${transactionId}`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function deleteBpTransaction(transactionId: number): Promise<void> {
  await http.delete(`/admin/bp-transactions/${transactionId}`, {
    headers: getAdminAuthHeaders(),
  });
}
