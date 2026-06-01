export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin';
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
