import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  BadgeFilter,
  BadgeFormValues,
  BadgeRow,
  UploadedBadgeIcon,
} from '@/admin/modules/badge/types/badge.type';

export const badgeQueryKeys = {
  all: ['badges'] as const,
  list: (filters: BadgeFilter) => [...badgeQueryKeys.all, filters] as const,
};

export async function getBadgeList(filters: BadgeFilter): Promise<PaginatedResponse<BadgeRow>> {
  const response = await http.get<PaginatedResponse<BadgeRow>>('/admin/badges', {
    headers: getAdminAuthHeaders(),
    params: {
      search: filters.keyword || undefined,
      page: filters.page,
      per_page: filters.perPage,
    },
  });

  return response.data;
}

export async function createBadge(payload: BadgeFormValues): Promise<BadgeRow> {
  const response = await http.post<{ data: BadgeRow }>('/admin/badges', payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateBadge(id: string, payload: BadgeFormValues): Promise<BadgeRow> {
  const response = await http.put<{ data: BadgeRow }>(`/admin/badges/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function deleteBadge(id: string): Promise<void> {
  await http.delete(`/admin/badges/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function uploadBadgeIcon(image: File): Promise<UploadedBadgeIcon> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('directory', 'badges');

  const response = await http.post<{ data: UploadedBadgeIcon }>('/admin/setting-images', formData, {
    headers: {
      ...getAdminAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}
