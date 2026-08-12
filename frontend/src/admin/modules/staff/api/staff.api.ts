import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  PermissionCatalog,
  StaffFilter,
  StaffFormValues,
  StaffRow,
} from '@/admin/modules/staff/types/staff.type';

export const staffQueryKeys = {
  all: ['staff'] as const,
  list: (filters: StaffFilter) => [...staffQueryKeys.all, filters] as const,
  catalog: ['staff', 'permission-catalog'] as const,
};

export async function getStaffList(filters: StaffFilter): Promise<PaginatedResponse<StaffRow>> {
  const response = await http.get<PaginatedResponse<StaffRow>>('/admin/staff', {
    headers: getAdminAuthHeaders(),
    params: {
      search: filters.keyword || undefined,
      page: filters.page,
      per_page: filters.perPage,
    },
  });

  return response.data;
}

export async function getPermissionCatalog(): Promise<PermissionCatalog> {
  const response = await http.get<{ data: PermissionCatalog }>('/admin/permissions/catalog', {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function createStaff(payload: StaffFormValues): Promise<StaffRow> {
  const response = await http.post<{ data: StaffRow }>('/admin/staff', payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateStaff(id: number, payload: StaffFormValues): Promise<StaffRow> {
  const response = await http.put<{ data: StaffRow }>(`/admin/staff/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateStaffPermissions(
  id: number,
  permissions: string[],
): Promise<StaffRow> {
  const response = await http.put<{ data: StaffRow }>(
    `/admin/staff/${id}/permissions`,
    { permissions },
    {
      headers: getAdminAuthHeaders(),
    },
  );

  return response.data.data;
}

export async function deleteStaff(id: number): Promise<void> {
  await http.delete(`/admin/staff/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}
