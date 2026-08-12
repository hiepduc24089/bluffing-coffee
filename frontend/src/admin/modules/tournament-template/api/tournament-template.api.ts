import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  TournamentTemplateFilter,
  TournamentTemplateFormValues,
  TournamentTemplateRow,
} from '@/admin/modules/tournament-template/types/tournament-template.type';

export const tournamentTemplateQueryKeys = {
  all: ['tournament-templates'] as const,
  list: (filters: TournamentTemplateFilter) =>
    [...tournamentTemplateQueryKeys.all, filters] as const,
  options: ['tournament-templates', 'options'] as const,
};

export async function getTournamentTemplateList(
  filters: TournamentTemplateFilter,
): Promise<PaginatedResponse<TournamentTemplateRow>> {
  const response = await http.get<PaginatedResponse<TournamentTemplateRow>>(
    '/admin/tournament-templates',
    {
      headers: getAdminAuthHeaders(),
      params: {
        search: filters.keyword || undefined,
        tournament_type: filters.tournamentType,
        page: filters.page,
        per_page: filters.perPage,
      },
    },
  );

  return response.data;
}

export async function getTournamentTemplateOptions(): Promise<TournamentTemplateRow[]> {
  const response = await http.get<PaginatedResponse<TournamentTemplateRow>>(
    '/admin/tournament-templates',
    {
      headers: getAdminAuthHeaders(),
      params: {
        per_page: 100,
      },
    },
  );

  return response.data.data;
}

export async function createTournamentTemplate(
  payload: TournamentTemplateFormValues,
): Promise<TournamentTemplateRow> {
  const response = await http.post<{ data: TournamentTemplateRow }>(
    '/admin/tournament-templates',
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function updateTournamentTemplate(
  id: number,
  payload: TournamentTemplateFormValues,
): Promise<TournamentTemplateRow> {
  const response = await http.put<{ data: TournamentTemplateRow }>(
    `/admin/tournament-templates/${id}`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function duplicateTournamentTemplate(id: number): Promise<TournamentTemplateRow> {
  const response = await http.post<{ data: TournamentTemplateRow }>(
    `/admin/tournament-templates/${id}/duplicate`,
    null,
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function deleteTournamentTemplate(id: number): Promise<void> {
  await http.delete(`/admin/tournament-templates/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}
