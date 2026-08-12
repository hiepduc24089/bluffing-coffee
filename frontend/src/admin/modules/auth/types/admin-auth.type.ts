export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin';
  /** Chủ quán: bỏ qua mọi kiểm tra quyền. */
  isSuperAdmin: boolean;
  /** Chuỗi dạng `module.action` hoặc `special.*`, do backend sinh. */
  permissions: string[];
};

export type AdminLoginPayload = {
  email: string;
  password: string;
};

export type AdminLoginResponse = {
  data: {
    user: AdminUser;
    token: string;
    tokenType: 'Bearer';
  };
};
