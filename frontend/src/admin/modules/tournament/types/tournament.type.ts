export type TournamentStatus = 'draft' | 'published' | 'running' | 'completed';

export type TournamentRow = {
  id: string;
  name: string;
  buyIn: number;
  capacity: number;
  status: TournamentStatus;
  startAt: string;
};

export type TournamentFilter = {
  keyword: string;
  status?: TournamentStatus;
  page: number;
  perPage: number;
};

export type TournamentFormValues = {
  name: string;
  buyIn: number;
  capacity: number;
  status: TournamentStatus;
  startAt: string;
};
