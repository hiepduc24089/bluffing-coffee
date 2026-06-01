import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Card, Form, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTextField from '@/shared/components/atoms/AppTextField';

type LoginFormValues = {
  email: string;
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
  const handleSubmit = (_values: LoginFormValues) => {
    // Tích hợp API sau khi chốt contract đăng nhập backend.
  };

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

        <Form<LoginFormValues> layout="vertical" requiredMark={false} onFinish={handleSubmit}>
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
              placeholder="thanhvien@bluffing.coffee"
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

          <AppButton type="primary" size="large" htmlType="submit" block>
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
