export type GameFormatTournamentType = 'normal' | 'deepstack' | 'turbo' | 'sitngo';

export type GameFormatLevel = {
  id: number;
  position: number;
  levelNumber: number | null;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
  isBreak: boolean;
  note?: string | null;
};

export type GameFormatRow = {
  id: number;
  name: string;
  code: string;
  tournamentType: GameFormatTournamentType;
  startingStack: number;
  lateRegUntilLevel?: number | null;
  maxRebuy?: number | null;
  rebuyStack?: number | null;
  description?: string | null;
  isActive: boolean;
  levels: GameFormatLevel[];
  levelCount: number;
  breakCount: number;
  totalDurationMinutes: number;
  createdAt: string;
};

export type GameFormatFilter = {
  keyword: string;
  tournamentType?: GameFormatTournamentType;
  isActive?: boolean;
  page: number;
  perPage: number;
};

export type GameFormatLevelFormValues = {
  levelNumber?: number | null;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
  isBreak: boolean;
  note?: string | null;
};

export type GameFormatFormValues = {
  name: string;
  code: string;
  tournamentType: GameFormatTournamentType;
  startingStack: number;
  lateRegUntilLevel?: number | null;
  maxRebuy?: number | null;
  rebuyStack?: number | null;
  description?: string | null;
  isActive: boolean;
  levels: GameFormatLevelFormValues[];
};
