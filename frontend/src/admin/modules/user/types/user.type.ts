export type UserRow = {
  id: string;
  name: string;
  phone: string;
  role: string;
  bpBalance: number;
  rankLevel?: string | null;
  createdAt: string;
};

export type UserFilter = {
  keyword: string;
  page: number;
  perPage: number;
};

export type UserFormValues = {
  name: string;
  phone: string;
};
