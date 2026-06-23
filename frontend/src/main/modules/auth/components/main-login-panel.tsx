import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { Alert, Card, Form, Space, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { loginMain, mainAuthQueryKeys } from '@/main/modules/auth/api/main-auth.api';
import { setMainAuthToken } from '@/main/modules/auth/utils/main-auth-storage';

type LoginFormValues = {
  phone: string;
  password: string;
};

type MainLoginPanelProps = {
  title: string;
  subtitle: string;
  submitText: string;
  alternateText: string;
  alternateLinkText: string;
  alternateTo: string;
};

export function MainLoginPanel({
  title,
  subtitle,
  submitText,
  alternateText,
  alternateLinkText,
  alternateTo,
}: MainLoginPanelProps) {
  const [form] = Form.useForm<LoginFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fromLocation = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const from = fromLocation?.pathname
    ? `${fromLocation.pathname}${fromLocation.search ?? ''}`
    : undefined;

  const loginMutation = useMutation({
    mutationFn: loginMain,
    onSuccess: async (result) => {
      setMainAuthToken(result.token);
      await queryClient.invalidateQueries({ queryKey: mainAuthQueryKeys.me });
      navigate(from && from !== '/login' ? from : '/check-in', { replace: true });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: Record<string, string[]>;
      }>;
      const phoneMessage = axiosError.response?.data?.errors?.phone?.[0];

      if (phoneMessage) {
        form.setFields([
          {
            name: 'phone',
            errors: ['Số điện thoại hoặc mật khẩu không đúng'],
          },
        ]);
      }
    },
  });

  return (
    <main className="login-screen">
      <section className="login-hero">
        <Typography.Text className="login-eyebrow">Bluffing Coffee</Typography.Text>
        <Typography.Title className="login-brand-title">Bluffing Coffee</Typography.Title>
        <Typography.Paragraph className="login-brand-copy">
          Theo dõi sự kiện sắp diễn ra, hoạt động thành viên và thông tin giải đấu từ trang chính.
        </Typography.Paragraph>
      </section>

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
            description="Vui lòng kiểm tra số điện thoại và mật khẩu rồi thử lại."
          />
        )}

        <Form<LoginFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => loginMutation.mutate(values)}
        >
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <AppTextField
              size="large"
              placeholder="0900000001"
              prefix={<PhoneOutlined />}
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
