export type TournamentTypeValue = 'normal' | 'deepstack' | 'turbo' | 'sitngo';

export type TournamentTemplateLevel = {
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

export type TournamentTemplateReward = {
  id: number;
  position: number;
  bpReward: number;
};

export type TournamentTemplateRow = {
  id: number;
  name: string;
  code: string;
  tournamentType: TournamentTypeValue;
  startingStack: number;
  lateRegUntilLevel?: number | null;
  rebuyStack?: number | null;
  description?: string | null;
  defaultPriceWithDrink: number;
  defaultPriceWithoutDrink: number;
  levels: TournamentTemplateLevel[];
  rewards: TournamentTemplateReward[];
  levelCount: number;
  breakCount: number;
  totalDurationMinutes: number;
  createdAt: string;
};

export type TournamentTemplateFilter = {
  keyword: string;
  tournamentType?: TournamentTypeValue;
  page: number;
  perPage: number;
};

export type TournamentTemplateLevelFormValues = {
  levelNumber?: number | null;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
  isBreak: boolean;
  note?: string | null;
};

export type TournamentTemplateRewardFormValues = {
  position: number;
  bpReward: number;
};

export type TournamentTemplateFormValues = {
  name: string;
  code: string;
  tournamentType: TournamentTypeValue;
  startingStack: number;
  lateRegUntilLevel?: number | null;
  rebuyStack?: number | null;
  description?: string | null;
  defaultPriceWithDrink: number;
  defaultPriceWithoutDrink: number;
  levels: TournamentTemplateLevelFormValues[];
  rewards: TournamentTemplateRewardFormValues[];
};
