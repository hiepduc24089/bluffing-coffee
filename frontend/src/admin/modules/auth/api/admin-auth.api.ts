import { http } from '@/shared/lib/http';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  AdminLoginPayload,
  AdminLoginResponse,
  AdminUser,
} from '@/admin/modules/auth/types/admin-auth.type';

export const adminAuthQueryKeys = {
  me: ['admin', 'auth', 'me'] as const,
};

export async function loginAdmin(payload: AdminLoginPayload): Promise<AdminLoginResponse['data']> {
  const response = await http.post<AdminLoginResponse>('/admin/auth/login', payload);

  return response.data.data;
}

export async function getAdminMe(): Promise<AdminUser> {
  const response = await http.get<{ data: AdminUser }>('/admin/auth/me', {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function logoutAdmin(): Promise<void> {
  await http.post('/admin/auth/logout', null, {
    headers: getAdminAuthHeaders(),
  });
}
