import { http } from '@/shared/lib/http';
import type { ClockTournamentTemplate } from '@/main/modules/clock/types/clock.type';

export const clockQueryKeys = {
  all: ['clock-tournament-templates'] as const,
  detail: (code: string) => [...clockQueryKeys.all, code] as const,
};

export async function getClockTournamentTemplates(): Promise<ClockTournamentTemplate[]> {
  const response = await http.get<{ data: ClockTournamentTemplate[] }>('/main/tournament-templates');

  return response.data.data;
}

export async function getClockTournamentTemplate(code: string): Promise<ClockTournamentTemplate> {
  const response = await http.get<{ data: ClockTournamentTemplate }>(`/main/tournament-templates/${code}`);

  return response.data.data;
}
