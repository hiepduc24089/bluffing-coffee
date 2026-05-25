import { DashboardOutlined, TrophyOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: <Link to="/dashboard">Dashboard</Link>,
  },
  {
    key: '/tournaments',
    icon: <TrophyOutlined />,
    label: <Link to="/tournaments">Tournaments</Link>,
  },
];

export function AdminLayout() {
  const location = useLocation();
  const selectedKeys = location.pathname.startsWith('/tournaments')
    ? ['/tournaments']
    : ['/dashboard'];

  return (
    <Layout className="app-shell">
      <Sider width={240} theme="light" className="app-sider">
        <div className="app-brand">
          <Typography.Title level={4} className="app-brand__title">
            Bluffing Coffee
          </Typography.Title>
          <Typography.Text type="secondary">Admin Console</Typography.Text>
        </div>
        <Menu mode="inline" selectedKeys={selectedKeys} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Title level={3} className="app-header__title">
            Bluffing Coffee Management
          </Typography.Title>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
