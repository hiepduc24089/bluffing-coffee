export type ClockLevel = {
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

export type ClockTournamentTemplate = {
  id: number;
  name: string;
  code: string;
  startingStack: number;
  lateRegUntilLevel?: number | null;
  rebuyStack?: number | null;
  description?: string | null;
  levels: ClockLevel[];
  levelCount: number;
  breakCount: number;
  totalDurationMinutes: number;
};

export type ClockState = {
  levelIndex: number;
  /** Remaining time captured while paused. */
  remainingMs: number;
  /** Epoch ms the current level ends at, or null while paused. */
  endsAt: number | null;
};
