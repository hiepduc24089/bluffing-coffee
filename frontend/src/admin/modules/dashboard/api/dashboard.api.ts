import { http } from '@/shared/lib/http';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type { DashboardSummary } from '@/admin/modules/dashboard/types/dashboard.type';

export const dashboardQueryKeys = {
  all: ['admin-dashboard'] as const,
  summary: () => [...dashboardQueryKeys.all, 'summary'] as const,
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await http.get<{ data: DashboardSummary }>('/admin/dashboard', {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}
