import { useQuery } from '@tanstack/react-query';
import { getTournamentList, tournamentQueryKeys } from '@/modules/tournament/api/tournament.api';
import type { TournamentFilter } from '@/modules/tournament/types/tournament.type';

export function useTournamentList(filters: TournamentFilter) {
  return useQuery({
    queryKey: tournamentQueryKeys.list(filters),
    queryFn: () => getTournamentList(filters),
  });
}
