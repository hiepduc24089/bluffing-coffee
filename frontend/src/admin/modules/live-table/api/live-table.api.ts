import { http } from '@/shared/lib/http';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type { TournamentRow } from '@/admin/modules/tournament/types/tournament.type';
import type { LiveTableKey, LiveTableState } from '@/admin/modules/live-table/types/live-table.type';

export const liveTableQueryKeys = {
  all: ['live-tables'] as const,
  todayTournaments: ['live-tables', 'today-tournaments'] as const,
  detail: (tableKey: LiveTableKey, tournamentId?: string) =>
    ['live-tables', tableKey, tournamentId ?? 'current'] as const,
};

export async function getTodayLiveTableTournaments(): Promise<TournamentRow[]> {
  const response = await http.get<{ data: TournamentRow[] }>('/admin/live-tables/tournaments/today', {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function getLiveTableState(tableKey: LiveTableKey, tournamentId?: string): Promise<LiveTableState> {
  const response = await http.get<{ data: LiveTableState }>(`/admin/live-tables/${tableKey}`, {
    headers: getAdminAuthHeaders(),
    params: {
      tournamentId,
    },
  });

  return response.data.data;
}

export async function selectLiveTableTournament(tableKey: LiveTableKey, tournamentId: string): Promise<LiveTableState> {
  const response = await http.put<{ data: LiveTableState }>(
    `/admin/live-tables/${tableKey}/tournament`,
    { tournamentId },
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function moveLiveTableSeat(
  tableKey: LiveTableKey,
  payload: {
    tournamentId: string;
    tournamentRegistrationId: number;
    toSeatNumber: number;
  },
): Promise<LiveTableState> {
  const response = await http.post<{ data: LiveTableState }>(
    `/admin/live-tables/${tableKey}/seats/move`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function clearLiveTableSeat(
  tableKey: LiveTableKey,
  tournamentId: string,
  seatNumber: number,
): Promise<LiveTableState> {
  const response = await http.delete<{ data: LiveTableState }>(
    `/admin/live-tables/${tableKey}/seats/${seatNumber}`,
    {
      headers: getAdminAuthHeaders(),
      data: { tournamentId },
    },
  );

  return response.data.data;
}

export async function eliminateLiveTableSeat(
  tableKey: LiveTableKey,
  tournamentId: string,
  seatNumber: number,
  note?: string,
): Promise<LiveTableState> {
  const response = await http.post<{ data: LiveTableState }>(
    `/admin/live-tables/${tableKey}/seats/${seatNumber}/eliminate`,
    { tournamentId, note },
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function rebuyLiveTablePlayer(tournamentId: string, registrationId: number): Promise<void> {
  await http.post(
    `/admin/live-tables/registrations/${registrationId}/rebuy`,
    { tournamentId },
    {
      headers: getAdminAuthHeaders(),
    },
  );
}
