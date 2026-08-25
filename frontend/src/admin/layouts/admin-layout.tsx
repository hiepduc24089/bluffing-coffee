import {
  ControlOutlined,
  DashboardOutlined,
  TagsOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  BarChartOutlined,
  TableOutlined,
  SettingOutlined,
  FileTextOutlined,
  PictureOutlined,
  CalendarOutlined,
  IdcardOutlined,
  ScheduleOutlined,
  DollarOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import brandLogo from '@/assets/images/logo/LOGO_BLUFFING_OL_BLUFFING_LOGO_NGANG_W.png';
import { useAdminPermissions } from '@/admin/modules/auth/hooks/use-admin-permissions';

const { Header, Sider, Content } = Layout;

type MenuEntry = {
  key: string;
  icon?: ReactNode;
  label: ReactNode;
  /** Quyền tối thiểu để thấy mục này. Bỏ trống nghĩa là ai đăng nhập cũng thấy. */
  permission?: string;
  children?: MenuEntry[];
};

const STAFF_MANAGEMENT_KEY = '/admin/staff-management';
const STAFF_MANAGEMENT_PATHS = ['/admin/schedule', '/admin/payroll', '/admin/staff'];

function isStaffManagementPath(pathname: string): boolean {
  return STAFF_MANAGEMENT_PATHS.some((path) => pathname.startsWith(path));
}

const menuEntries: MenuEntry[] = [
  {
    key: '/admin/dashboard',
    icon: <DashboardOutlined />,
    label: <Link to="/admin/dashboard">Tổng quan</Link>,
    permission: 'dashboard.view',
  },
  {
    key: '/admin/users',
    icon: <TeamOutlined />,
    label: <Link to="/admin/users">Thành viên</Link>,
    permission: 'user.view',
  },
  {
    key: '/admin/tournament-templates',
    icon: <ControlOutlined />,
    label: <Link to="/admin/tournament-templates">Chế độ chơi</Link>,
    permission: 'tournament_template.view',
  },
  {
    key: '/admin/tournaments',
    icon: <TrophyOutlined />,
    label: <Link to="/admin/tournaments">Giải đấu</Link>,
    permission: 'tournament.view',
  },
  {
    key: '/admin/tournament-registrations',
    icon: <UserAddOutlined />,
    label: <Link to="/admin/tournament-registrations">Đăng ký giải</Link>,
    permission: 'tournament_registration.view',
  },
  {
    key: '/admin/badges',
    icon: <TagsOutlined />,
    label: <Link to="/admin/badges">Huy hiệu</Link>,
    permission: 'badge.view',
  },
  {
    key: '/admin/leaderboard',
    icon: <BarChartOutlined />,
    label: <Link to="/admin/leaderboard">Leaderboard</Link>,
    permission: 'leaderboard.view',
  },
  {
    key: '/admin/live-tables',
    icon: <TableOutlined />,
    label: 'Live Table',
    permission: 'live_table.view',
    children: [
      {
        key: '/admin/live-tables/black',
        label: <Link to="/admin/live-tables/black">Bàn Đen</Link>,
      },
      {
        key: '/admin/live-tables/red',
        label: <Link to="/admin/live-tables/red">Bàn Đỏ</Link>,
      },
      {
        key: '/admin/live-tables/green',
        label: <Link to="/admin/live-tables/green">Bàn Xanh Lá</Link>,
      },
    ],
  },
  {
    key: STAFF_MANAGEMENT_KEY,
    icon: <UsergroupAddOutlined />,
    label: 'Quản lý nhân viên',
    children: [
      {
        key: '/admin/schedule',
        icon: <ScheduleOutlined />,
        label: <Link to="/admin/schedule">Lịch làm việc</Link>,
        permission: 'schedule.view',
      },
      {
        key: '/admin/payroll',
        icon: <DollarOutlined />,
        label: <Link to="/admin/payroll">Bảng lương</Link>,
        permission: 'payroll.view',
      },
      {
        key: '/admin/staff',
        icon: <IdcardOutlined />,
        label: <Link to="/admin/staff">Nhân viên</Link>,
        permission: 'special.manage_staff',
      },
    ],
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: 'Setting',
    children: [
      {
        key: '/admin/settings/posts',
        icon: <FileTextOutlined />,
        label: <Link to="/admin/settings/posts">Bài viết</Link>,
        permission: 'setting.view',
      },
      {
        key: '/admin/settings/banners',
        icon: <PictureOutlined />,
        label: <Link to="/admin/settings/banners">Banner</Link>,
        permission: 'setting.view',
      },
      {
        key: '/admin/settings/events',
        icon: <CalendarOutlined />,
        label: <Link to="/admin/settings/events">Sự kiện</Link>,
        permission: 'setting.view',
      },
    ],
  },
];

/**
 * Nhóm menu chỉ hiện khi còn ít nhất một mục con xem được, nếu không nhân viên
 * sẽ thấy một nhóm rỗng bấm vào không ra gì.
 */
function filterMenuEntries(
  entries: MenuEntry[],
  can: (permission: string) => boolean,
): MenuEntry[] {
  return entries.reduce<MenuEntry[]>((visible, entry) => {
    if (entry.permission && !can(entry.permission)) {
      return visible;
    }

    if (!entry.children) {
      return [...visible, entry];
    }

    const children = filterMenuEntries(entry.children, can);

    return children.length ? [...visible, { ...entry, children }] : visible;
  }, []);
}

export function AdminLayout() {
  const location = useLocation();
  const { can } = useAdminPermissions();
  const menuItems = filterMenuEntries(menuEntries, can).map(stripPermission);

  const selectedKeys = location.pathname.startsWith('/admin/tournaments')
    ? ['/admin/tournaments']
    : location.pathname.startsWith('/admin/tournament-registrations')
      ? ['/admin/tournament-registrations']
    : location.pathname.startsWith('/admin/tournament-templates')
      ? ['/admin/tournament-templates']
    : location.pathname.startsWith('/admin/users')
      ? ['/admin/users']
    : location.pathname.startsWith('/admin/badges')
      ? ['/admin/badges']
    : location.pathname.startsWith('/admin/leaderboard')
      ? ['/admin/leaderboard']
    : location.pathname.startsWith('/admin/live-tables')
      ? [location.pathname]
    : location.pathname.startsWith('/admin/settings')
      ? [location.pathname]
    : isStaffManagementPath(location.pathname)
      ? [location.pathname]
    : ['/admin/dashboard'];

  const defaultOpenKeys = [
    ...(location.pathname.startsWith('/admin/live-tables') ? ['/admin/live-tables'] : []),
    ...(location.pathname.startsWith('/admin/settings') ? ['/admin/settings'] : []),
    ...(isStaffManagementPath(location.pathname) ? [STAFF_MANAGEMENT_KEY] : []),
  ];

  return (
    <Layout className="app-shell">
      <Sider width={240} theme="light" className="app-sider">
        <div className="app-brand">
          <Link to="/admin" className="app-brand__link">
            <img src={brandLogo} alt="Bluffing Coffee" className="app-brand__logo" />
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={defaultOpenKeys}
          items={menuItems}
        />
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

type AntdMenuItem = Omit<MenuEntry, 'permission' | 'children'> & { children?: AntdMenuItem[] };

function stripPermission({ permission: _permission, children, ...entry }: MenuEntry): AntdMenuItem {
  return {
    ...entry,
    ...(children ? { children: children.map(stripPermission) } : {}),
  };
}
