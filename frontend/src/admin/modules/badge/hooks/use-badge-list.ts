import { useQuery } from '@tanstack/react-query';
import { badgeQueryKeys, getBadgeList } from '@/admin/modules/badge/api/badge.api';
import type { BadgeFilter } from '@/admin/modules/badge/types/badge.type';

export function useBadgeList(filters: BadgeFilter) {
  return useQuery({
    queryKey: badgeQueryKeys.list(filters),
    queryFn: () => getBadgeList(filters),
  });
}
