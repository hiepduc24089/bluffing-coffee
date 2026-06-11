export type TournamentStatus = 'draft' | 'published' | 'running' | 'completed';

export type TournamentRow = {
  id: string;
  name: string;
  buyIn: number;
  ticketPriceWithDrink: number;
  ticketPriceWithoutDrink: number;
  capacity: number;
  status: TournamentStatus;
  rewardProfileId?: number | null;
  rewardProfile?: RewardProfile;
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
  ticketPriceWithDrink: number;
  ticketPriceWithoutDrink: number;
  capacity: number;
  status: TournamentStatus;
  rewardProfileId?: number | null;
  startAt: string;
};

export type RewardProfileItem = {
  id: number;
  position: number;
  bpReward: number;
};

export type RewardProfile = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  defaultPriceWithDrink: number;
  defaultPriceWithoutDrink: number;
  items: RewardProfileItem[];
};

export type RewardProfileFormValues = {
  name: string;
  code: string;
  isActive: boolean;
  defaultPriceWithDrink: number;
  defaultPriceWithoutDrink: number;
  items: Array<{
    position: number;
    bpReward: number;
  }>;
};

export type TournamentRegistrationStatus = 'registered' | 'finished' | 'cancelled';

export type TournamentRegistrationRow = {
  id: number;
  tournamentId: string;
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
