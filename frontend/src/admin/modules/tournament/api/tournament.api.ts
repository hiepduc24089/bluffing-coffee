import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  TournamentFilter,
  TournamentFormValues,
  TournamentRow,
} from '@/admin/modules/tournament/types/tournament.type';

const mockRows: TournamentRow[] = [
  {
    id: 'tour-001',
    name: 'Giải tối thứ sáu',
    buyIn: 150000,
    capacity: 60,
    status: 'published',
    startAt: '2026-05-16 19:00',
  },
  {
    id: 'tour-002',
    name: 'Giải chủ nhật',
    buyIn: 500000,
    capacity: 120,
    status: 'draft',
    startAt: '2026-05-18 14:00',
  },
];

export const tournamentQueryKeys = {
  all: ['tournaments'] as const,
  list: (filters: TournamentFilter) => [...tournamentQueryKeys.all, filters] as const,
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
