import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Card, Form, Space, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { adminAuthQueryKeys, loginAdmin } from '@/admin/modules/auth/api/admin-auth.api';
import { setAdminAuthToken } from '@/admin/modules/auth/utils/admin-auth-storage';

type LoginFormValues = {
  email: string;
  password: string;
};

type AdminLoginPanelProps = {
  title: string;
  subtitle: string;
  submitText: string;
  alternateText: string;
  alternateLinkText: string;
  alternateTo: string;
};

export function AdminLoginPanel({
  title,
  subtitle,
  submitText,
  alternateText,
  alternateLinkText,
  alternateTo,
}: AdminLoginPanelProps) {
  const [form] = Form.useForm<LoginFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: async (result) => {
      setAdminAuthToken(result.token);
      await queryClient.invalidateQueries({ queryKey: adminAuthQueryKeys.me });
      navigate(from && from !== '/admin/login' ? from : '/admin/dashboard', { replace: true });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: Record<string, string[]>;
      }>;
      const emailMessage = axiosError.response?.data?.errors?.email?.[0];

      if (emailMessage) {
        form.setFields([
          {
            name: 'email',
            errors: ['Email hoặc mật khẩu không đúng'],
          },
        ]);
      }
    },
  });

  return (
    <main className="login-screen login-screen--centered">
      <Card className="login-card">
        <Space direction="vertical" size={4} className="login-card__header">
          <Typography.Title level={3}>{title}</Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </Space>

        {loginMutation.isError && (
          <Alert
            className="login-card__alert"
            type="error"
            showIcon
            message="Đăng nhập thất bại"
            description="Vui lòng kiểm tra email và mật khẩu rồi thử lại."
          />
        )}

        <Form<LoginFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => loginMutation.mutate(values)}
        >
          <Form.Item
            name="email"
            label="Địa chỉ email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <AppTextField
              size="large"
              placeholder="quanly@bluffing.coffee"
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <AppTextField
              size="large"
              type="password"
              placeholder="Nhập mật khẩu"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <AppButton
            type="primary"
            size="large"
            htmlType="submit"
            loading={loginMutation.isPending}
            block
          >
            {submitText}
          </AppButton>
        </Form>

        <Typography.Text type="secondary" className="login-card__alternate">
          {alternateText} <Link to={alternateTo}>{alternateLinkText}</Link>
        </Typography.Text>
      </Card>
    </main>
  );
}
