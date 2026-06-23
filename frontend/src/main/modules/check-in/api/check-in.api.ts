import { http } from '@/shared/lib/http';
import { getMainAuthHeaders } from '@/main/modules/auth/utils/main-auth-storage';
import type {
  CheckInEntryType,
  CheckInRegistration,
  CheckInTournament,
} from '@/main/modules/check-in/types/check-in.type';

export const checkInQueryKeys = {
  todayTournaments: ['main', 'check-in', 'tournaments', 'today'] as const,
  currentRegistration: ['main', 'check-in', 'current'] as const,
};

export async function getTodayCheckInTournaments(): Promise<CheckInTournament[]> {
  const response = await http.get<{ data: CheckInTournament[] }>('/main/check-in/tournaments/today', {
    headers: getMainAuthHeaders(),
  });

  return response.data.data;
}

export async function getCurrentCheckInRegistration(): Promise<CheckInRegistration | null> {
  const response = await http.get<{ data: CheckInRegistration | null }>('/main/check-in/current', {
    headers: getMainAuthHeaders(),
  });

  return response.data.data;
}

export async function checkInTournament(payload: {
  tournamentId: string;
  entryType: CheckInEntryType;
}): Promise<CheckInRegistration> {
  const response = await http.post<{ data: CheckInRegistration }>('/main/check-in', payload, {
    headers: getMainAuthHeaders(),
  });

  return response.data.data;
}
