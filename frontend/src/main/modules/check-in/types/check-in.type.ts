export type CheckInEntryType = 'with_drink' | 'without_drink';

export type CheckInTournament = {
  id: string;
  name: string;
  ticketPriceWithDrink: number;
  ticketPriceWithoutDrink: number;
  capacity: number;
  status: 'published' | 'running';
  startAt: string;
};

export type CheckInRegistration = {
  id: number;
  tournamentId: string;
  tournament?: CheckInTournament;
  entryPrice: number;
  entryType?: CheckInEntryType | null;
  status: 'registered' | 'finished' | 'cancelled';
  createdAt: string;
};
