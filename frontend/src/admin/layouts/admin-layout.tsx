import {
  DashboardOutlined,
  GiftOutlined,
  TagsOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/admin/dashboard',
    icon: <DashboardOutlined />,
    label: <Link to="/admin/dashboard">Tổng quan</Link>,
  },
  {
    key: '/admin/users',
    icon: <TeamOutlined />,
    label: <Link to="/admin/users">Thành viên</Link>,
  },
  {
    key: '/admin/badges',
    icon: <TagsOutlined />,
    label: <Link to="/admin/badges">Huy hiệu</Link>,
  },
  {
    key: '/admin/leaderboard',
    icon: <BarChartOutlined />,
    label: <Link to="/admin/leaderboard">Leaderboard</Link>,
  },
  {
    key: '/admin/reward-profiles',
    icon: <GiftOutlined />,
    label: <Link to="/admin/reward-profiles">Cấu hình giải đấu</Link>,
  },
  {
    key: '/admin/tournaments',
    icon: <TrophyOutlined />,
    label: <Link to="/admin/tournaments">Giải đấu</Link>,
  },
  {
    key: '/admin/tournament-registrations',
    icon: <UserAddOutlined />,
    label: <Link to="/admin/tournament-registrations">Đăng ký giải</Link>,
  },
];

export function AdminLayout() {
  const location = useLocation();
  const selectedKeys = location.pathname.startsWith('/admin/tournaments')
    ? ['/admin/tournaments']
    : location.pathname.startsWith('/admin/tournament-registrations')
      ? ['/admin/tournament-registrations']
    : location.pathname.startsWith('/admin/reward-profiles')
      ? ['/admin/reward-profiles']
    : location.pathname.startsWith('/admin/users')
      ? ['/admin/users']
    : location.pathname.startsWith('/admin/badges')
      ? ['/admin/badges']
    : location.pathname.startsWith('/admin/leaderboard')
      ? ['/admin/leaderboard']
    : ['/admin/dashboard'];

  return (
    <Layout className="app-shell">
      <Sider width={240} theme="light" className="app-sider">
        <div className="app-brand">
          <Typography.Title level={4} className="app-brand__title">
            Bluffing Coffee
          </Typography.Title>
          <Typography.Text type="secondary">Trang quản trị</Typography.Text>
        </div>
        <Menu mode="inline" selectedKeys={selectedKeys} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Title level={3} className="app-header__title">
            Quản lý Bluffing Coffee
          </Typography.Title>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
