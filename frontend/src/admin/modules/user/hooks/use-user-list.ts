import { useQuery } from '@tanstack/react-query';
import { getUserList, userQueryKeys } from '@/admin/modules/user/api/user.api';
import type { UserFilter } from '@/admin/modules/user/types/user.type';

export function useUserList(filters: UserFilter) {
  return useQuery({
    queryKey: userQueryKeys.list(filters),
    queryFn: () => getUserList(filters),
  });
}
