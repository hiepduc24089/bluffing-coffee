import { MainLoginPanel } from '@/main/modules/auth/components/main-login-panel';

export function MainLoginPage() {
  return (
    <MainLoginPanel
      title="Đăng nhập thành viên"
      subtitle="Theo dõi hồ sơ, sự kiện sắp diễn ra và hoạt động giải đấu của bạn."
      submitText="Đăng nhập"
      alternateText="Tài khoản nhân viên?"
      alternateLinkText="Đến đăng nhập quản trị"
      alternateTo="/admin/login"
    />
  );
}
