export type BadgeRow = {
  id: string;
  name: string;
  code: string;
  icon?: string | null;
  description?: string | null;
  createdAt: string;
};

export type BadgeFilter = {
  keyword: string;
  page: number;
  perPage: number;
};

export type BadgeFormValues = {
  name: string;
  code: string;
  icon?: string | null;
  description?: string | null;
};
