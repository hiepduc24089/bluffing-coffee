import type { TournamentTemplateRow } from '@/admin/modules/tournament-template/types/tournament-template.type';

export type TournamentPhase = 'upcoming' | 'running' | 'completed';

export type TournamentRow = {
  id: string;
  name: string;
  tournamentTemplateId?: number | null;
  tournamentTemplate?: TournamentTemplateRow | null;
  buyIn: number;
  ticketPriceWithDrink: number;
  ticketPriceWithoutDrink: number;
  capacity: number;
  phase: TournamentPhase;
  finalizedAt?: string | null;
  startAt: string;
};

export type TournamentFilter = {
  keyword: string;
  phase?: TournamentPhase;
  page: number;
  perPage: number;
};

export type TournamentFormValues = {
  name: string;
  tournamentTemplateId?: number | null;
  buyIn: number;
  ticketPriceWithDrink: number;
  ticketPriceWithoutDrink: number;
  capacity: number;
  startAt: string;
};

export type TournamentRegistrationStatus = 'registered' | 'finished' | 'cancelled';

export type TournamentRegistrationRow = {
  id: number;
  tournamentId: string;
  tournament?: TournamentRow;
  userId: number;
  user?: {
    id: string;
    name: string;
    phone: string;
    role: string;
    bpBalance: number;
    rankLevel?: string | null;
    createdAt: string;
  };
  entryPrice: number;
  entryType?: 'with_drink' | 'without_drink' | null;
  status: TournamentRegistrationStatus;
  finalPosition?: number | null;
  finishedAt?: string | null;
  createdAt: string;
};

export type BpTransactionRow = {
  id: number;
  userId: number;
  user?: {
    id: string;
    name: string;
    phone: string;
    role: string;
    bpBalance: number;
    rankLevel?: string | null;
    createdAt: string;
  };
  amount: number;
  transactionType: 'earned' | 'spent' | 'adjusted' | 'expired' | 'reversed';
  referenceType?: string | null;
  referenceId?: string | number | null;
  reference?: TournamentRegistrationRow | null;
  rewardKey?: string | null;
  expiresAt?: string | null;
  note?: string | null;
  createdBy?: number | null;
  createdAt: string;
};

export type TournamentRewardPreviewRow = {
  registrationId: number;
  userId: number;
  userName?: string | null;
  phone?: string | null;
  status: TournamentRegistrationStatus;
  finalPosition?: number | null;
  bpReward: number;
  alreadyRewarded: boolean;
  willReward: boolean;
  note?: string | null;
};
