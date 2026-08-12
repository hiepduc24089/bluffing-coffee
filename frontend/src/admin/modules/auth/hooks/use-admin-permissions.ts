import { useQuery } from '@tanstack/react-query';
import { adminAuthQueryKeys, getAdminMe } from '@/admin/modules/auth/api/admin-auth.api';
import { getAdminAuthToken } from '@/admin/modules/auth/utils/admin-auth-storage';

/**
 * Quyền lấy từ cùng query `me` mà RequireAdminAuth đã gọi, nên không phát sinh
 * request mới — chỉ đọc lại cache.
 */
export function useAdminPermissions() {
  const { data: admin, isLoading } = useQuery({
    queryKey: adminAuthQueryKeys.me,
    queryFn: getAdminMe,
    enabled: Boolean(getAdminAuthToken()),
    retry: false,
  });

  const can = (permission: string) => {
    if (!admin) return false;
    if (admin.isSuperAdmin) return true;

    return admin.permissions.includes(permission);
  };

  const canAny = (permissions: string[]) => permissions.some(can);

  return { admin, isLoading, can, canAny };
}
