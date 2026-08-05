import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  GameFormatFilter,
  GameFormatFormValues,
  GameFormatRow,
} from '@/admin/modules/game-format/types/game-format.type';

export const gameFormatQueryKeys = {
  all: ['game-formats'] as const,
  list: (filters: GameFormatFilter) => [...gameFormatQueryKeys.all, filters] as const,
  active: ['game-formats', 'active'] as const,
};

export async function getGameFormatList(
  filters: GameFormatFilter,
): Promise<PaginatedResponse<GameFormatRow>> {
  const response = await http.get<PaginatedResponse<GameFormatRow>>('/admin/game-formats', {
    headers: getAdminAuthHeaders(),
    params: {
      search: filters.keyword || undefined,
      tournament_type: filters.tournamentType,
      is_active: filters.isActive === undefined ? undefined : Number(filters.isActive),
      page: filters.page,
      per_page: filters.perPage,
    },
  });

  return response.data;
}

export async function getActiveGameFormats(): Promise<GameFormatRow[]> {
  const response = await http.get<PaginatedResponse<GameFormatRow>>('/admin/game-formats', {
    headers: getAdminAuthHeaders(),
    params: {
      is_active: 1,
      per_page: 100,
    },
  });

  return response.data.data;
}

export async function createGameFormat(payload: GameFormatFormValues): Promise<GameFormatRow> {
  const response = await http.post<{ data: GameFormatRow }>('/admin/game-formats', payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateGameFormat(
  id: number,
  payload: GameFormatFormValues,
): Promise<GameFormatRow> {
  const response = await http.put<{ data: GameFormatRow }>(`/admin/game-formats/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function duplicateGameFormat(id: number): Promise<GameFormatRow> {
  const response = await http.post<{ data: GameFormatRow }>(
    `/admin/game-formats/${id}/duplicate`,
    null,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function deleteGameFormat(id: number): Promise<void> {
  await http.delete(`/admin/game-formats/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}
