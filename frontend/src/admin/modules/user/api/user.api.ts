import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type { BadgeRow } from '@/admin/modules/badge/types/badge.type';
import type { UserDetail, UserFilter, UserFormValues, UserRow } from '@/admin/modules/user/types/user.type';

export const userQueryKeys = {
  all: ['users'] as const,
  list: (filters: UserFilter) => [...userQueryKeys.all, filters] as const,
  detail: (id: string) => [...userQueryKeys.all, 'detail', id] as const,
};

export async function getUserList(filters: UserFilter): Promise<PaginatedResponse<UserRow>> {
  const response = await http.get<PaginatedResponse<UserRow>>('/admin/users', {
    headers: getAdminAuthHeaders(),
    params: {
      search: filters.keyword || undefined,
      page: filters.page,
      per_page: filters.perPage,
    },
  });

  return response.data;
}

export async function createUser(payload: UserFormValues): Promise<UserRow> {
  const response = await http.post<{ data: UserRow }>('/admin/users', payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateUser(id: string, payload: UserFormValues): Promise<UserRow> {
  const response = await http.put<{ data: UserRow }>(`/admin/users/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function getUserDetail(id: string): Promise<UserDetail> {
  const response = await http.get<{ data: UserDetail }>(`/admin/users/${id}`, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`/admin/users/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function resetUserPassword(id: string): Promise<void> {
  await http.post(`/admin/users/${id}/reset-password`, null, {
    headers: getAdminAuthHeaders(),
  });
}

export async function attachUserBadge(userId: string, badgeId: string): Promise<BadgeRow[]> {
  const response = await http.post<{ data: BadgeRow[] }>(
    `/admin/users/${userId}/badges`,
    { badgeId },
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function detachUserBadge(userId: string, badgeId: string): Promise<void> {
  await http.delete(`/admin/users/${userId}/badges/${badgeId}`, {
    headers: getAdminAuthHeaders(),
  });
}
