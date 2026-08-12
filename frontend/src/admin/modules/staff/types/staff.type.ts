export type StaffRow = {
  id: number;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: string[];
  createdAt: string;
};

export type StaffFilter = {
  keyword: string;
  page: number;
  perPage: number;
};

export type StaffFormValues = {
  name: string;
  email: string;
  password?: string | null;
};

export type PermissionCatalogAction = {
  key: string;
  label: string;
  permission: string;
};

export type PermissionCatalogModule = {
  key: string;
  label: string;
  actions: PermissionCatalogAction[];
};

export type PermissionCatalog = {
  modules: PermissionCatalogModule[];
  specialPermissions: Array<{
    permission: string;
    label: string;
  }>;
};
