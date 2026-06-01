import { AdminLoginPanel } from '@/admin/modules/auth/components/admin-login-panel';

export function AdminLoginPage() {
  return (
    <AdminLoginPanel
      title="Đăng nhập quản trị"
      subtitle="Đăng nhập để quản lý lịch, giải đấu và vận hành địa điểm."
      submitText="Đăng nhập"
      alternateText="Bạn muốn vào trang chính?"
      alternateLinkText="Đến đăng nhập trang chính"
      alternateTo="/login"
    />
  );
}
