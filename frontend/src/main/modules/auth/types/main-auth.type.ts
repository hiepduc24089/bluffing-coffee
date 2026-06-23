export type MainUser = {
  id: number;
  name: string;
  phone: string;
  role: 'member';
  bpBalance: number;
  rankLevel?: string | null;
};

export type MainLoginPayload = {
  phone: string;
  password: string;
};

export type MainLoginResponse = {
  data: {
    user: MainUser;
    token: string;
    tokenType: 'Bearer';
  };
};
