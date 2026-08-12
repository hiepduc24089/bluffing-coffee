import { Result } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppButton from '@/shared/components/atoms/AppButton';
import { logoutAdmin } from '@/admin/modules/auth/api/admin-auth.api';
import { clearAdminAuthToken } from '@/admin/modules/auth/utils/admin-auth-storage';

/**
 * Tài khoản đăng nhập được nhưng chưa được gán quyền nào. Không có trang nào để
 * điều hướng tới nên hiển thị thông báo thay vì vòng lặp redirect.
 */
export function NoAccessPage() {
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSettled: () => {
      clearAdminAuthToken();
      navigate('/admin/login', { replace: true });
    },
  });

  return (
    <Result
      status="403"
      title="Chưa được cấp quyền"
      subTitle="Tài khoản của bạn chưa được gán quyền nào. Liên hệ chủ quán để được cấp quyền."
      extra={
        <AppButton type="primary" loading={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
          Đăng xuất
        </AppButton>
      }
    />
  );
}
