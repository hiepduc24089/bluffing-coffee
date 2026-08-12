import { useQuery } from '@tanstack/react-query';
import {
  tournamentTemplateQueryKeys,
  getTournamentTemplateList,
} from '@/admin/modules/tournament-template/api/tournament-template.api';
import type { TournamentTemplateFilter } from '@/admin/modules/tournament-template/types/tournament-template.type';

export function useTournamentTemplateList(filters: TournamentTemplateFilter) {
  return useQuery({
    queryKey: tournamentTemplateQueryKeys.list(filters),
    queryFn: () => getTournamentTemplateList(filters),
  });
}
