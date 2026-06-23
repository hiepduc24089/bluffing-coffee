import type { TournamentRegistrationRow, TournamentRow } from '@/admin/modules/tournament/types/tournament.type';

export type LiveTableKey = 'green' | 'red' | 'blue';

export type LiveTableInfo = {
  key: LiveTableKey;
  name: string;
  currentTournamentId?: string | null;
};

export type LiveTableSeat = {
  id: number;
  tableKey: LiveTableKey;
  tournamentId: string;
  tournamentRegistrationId: number;
  seatNumber: number;
  registration?: TournamentRegistrationRow;
  createdAt?: string;
  updatedAt?: string;
};

export type TournamentLiveEvent = {
  id: number;
  tournamentId: string;
  tableKey?: LiveTableKey | null;
  tournamentRegistrationId?: number | null;
  userId?: number | null;
  user?: TournamentRegistrationRow['user'];
  eventType: string;
  fromTableKey?: LiveTableKey | null;
  fromSeatNumber?: number | null;
  toTableKey?: LiveTableKey | null;
  toSeatNumber?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
};

export type LiveTableState = {
  table: LiveTableInfo;
  tournament?: TournamentRow | null;
  seats: LiveTableSeat[];
  availableRegistrations: TournamentRegistrationRow[];
  eliminatedRegistrations: TournamentRegistrationRow[];
  events: TournamentLiveEvent[];
};
