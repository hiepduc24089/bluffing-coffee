import { http } from '@/shared/lib/http';
import type { ClockGameFormat } from '@/main/modules/clock/types/clock.type';

export const clockQueryKeys = {
  all: ['clock-game-formats'] as const,
  detail: (code: string) => [...clockQueryKeys.all, code] as const,
};

export async function getClockGameFormats(): Promise<ClockGameFormat[]> {
  const response = await http.get<{ data: ClockGameFormat[] }>('/main/game-formats');

  return response.data.data;
}

export async function getClockGameFormat(code: string): Promise<ClockGameFormat> {
  const response = await http.get<{ data: ClockGameFormat }>(`/main/game-formats/${code}`);

  return response.data.data;
}
