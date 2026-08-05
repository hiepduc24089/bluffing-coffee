import { useQuery } from '@tanstack/react-query';
import {
  gameFormatQueryKeys,
  getGameFormatList,
} from '@/admin/modules/game-format/api/game-format.api';
import type { GameFormatFilter } from '@/admin/modules/game-format/types/game-format.type';

export function useGameFormatList(filters: GameFormatFilter) {
  return useQuery({
    queryKey: gameFormatQueryKeys.list(filters),
    queryFn: () => getGameFormatList(filters),
  });
}
