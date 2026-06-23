import { http } from '@/shared/lib/http';
import { getMainAuthHeaders } from '@/main/modules/auth/utils/main-auth-storage';
import type {
  MainLoginPayload,
  MainLoginResponse,
  MainUser,
} from '@/main/modules/auth/types/main-auth.type';

export const mainAuthQueryKeys = {
  me: ['main', 'auth', 'me'] as const,
};

export async function loginMain(payload: MainLoginPayload): Promise<MainLoginResponse['data']> {
  const response = await http.post<MainLoginResponse>('/main/auth/login', payload);

  return response.data.data;
}

export async function getMainMe(): Promise<MainUser> {
  const response = await http.get<{ data: MainUser }>('/main/auth/me', {
    headers: getMainAuthHeaders(),
  });

  return response.data.data;
}

export async function logoutMain(): Promise<void> {
  await http.post('/main/auth/logout', null, {
    headers: getMainAuthHeaders(),
  });
}
