export type StaffPosition = 'barista' | 'dealer';

export type StaffRow = {
  id: number;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  position: StaffPosition | null;
  positionLabel: string | null;
  /** Chỉ có mặt khi người đang đăng nhập được xem bảng lương toàn quán. */
  hourlyRate?: number | null;
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
  /** Bỏ trống nghĩa là tài khoản này không tham gia xếp ca. */
  position?: StaffPosition | null;
  hourlyRate?: number | null;
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
