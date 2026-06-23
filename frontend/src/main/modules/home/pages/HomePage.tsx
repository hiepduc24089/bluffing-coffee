import { useState } from 'react';
import {
  CalendarOutlined,
  CrownOutlined,
  FireOutlined,
  MenuOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import AppButton from '@/shared/components/atoms/AppButton';
import { getMainAuthToken } from '@/main/modules/auth/utils/main-auth-storage';
import headerLogo from '@/assets/images/logo/LOGO_BLUFFING_OL_BLUFFING_ICON_Y.png';

const rewardProfiles = [
  {
    name: 'Default Sit & Go',
    code: 'SIT_GO',
    price: '65.000đ',
    reward: 'Top 1: 150 BP',
    icon: <TrophyOutlined />,
  },
  {
    name: 'Default Turbo',
    code: 'TURBO',
    price: '85.000đ',
    reward: 'Top 1: 180 BP',
    icon: <FireOutlined />,
  },
  {
    name: 'Default DeepStack',
    code: 'DEEPSTACK',
    price: '120.000đ',
    reward: 'Top 1: 250 BP',
    icon: <CrownOutlined />,
  },
];

const posts = [
  {
    title: 'Lịch sinh hoạt tuần này tại Bluffing Coffee',
    category: 'Thông báo',
    excerpt: 'Các khung giờ tournament, bàn live và hoạt động cộng đồng trong tuần.',
  },
  {
    title: 'Cách chuẩn bị trước khi tham gia Sit & Go',
    category: 'Hướng dẫn',
    excerpt: 'Một số lưu ý về check-in, gói vé và cách theo dõi kết quả sau giải.',
  },
  {
    title: 'BP và huy hiệu thành viên hoạt động như thế nào?',
    category: 'Thành viên',
    excerpt: 'Điểm BP, leaderboard và huy hiệu giúp ghi nhận thành tích của người chơi.',
  },
];

export function HomePage() {
  const isLoggedIn = Boolean(getMainAuthToken());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountLink = isLoggedIn ? '/check-in' : '/login';
  const accountLabel = isLoggedIn ? 'Profile' : 'Đăng nhập';

  const navItems = [
    { label: 'Trang chủ', href: '#home' },
    { label: 'Thông tin giải đấu', href: '#tournaments' },
    { label: 'Event', href: '#events' },
    { label: 'Bài viết', href: '#posts' },
  ];

  return (
    <main className="site-page">
      <section id="home" className="site-hero">
        <header className="site-header">
          <div className="site-header__inner">
            <Link to="/" className="site-logo" aria-label="Bluffing Coffee">
              <img src={headerLogo} alt="Bluffing Coffee" className="site-logo__image" />
            </Link>
            <nav className="site-nav" aria-label="Điều hướng chính">
              {navItems.map((item) => (
                <a key={item.href} className="site-nav__link" href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="site-header__action">
              {isLoggedIn ? (
                <AppButton
                  className="site-header-button"
                  icon={<UserOutlined />}
                  href="/check-in"
                >
                  Profile
                </AppButton>
              ) : (
                <AppButton type="primary" href="/login">
                  Đăng nhập
                </AppButton>
              )}
            </div>
            <button
              type="button"
              className="site-menu-button"
              aria-label="Mở menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <MenuOutlined />
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="site-mobile-menu">
              <nav className="site-mobile-menu__nav" aria-label="Menu mobile">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    className="site-mobile-menu__link"
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Link
                  className="site-mobile-menu__link"
                  to={accountLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {accountLabel}
                </Link>
              </nav>
            </div>
          ) : null}
        </header>

        <div className="site-hero__content">
          <div className="site-hero__copy">
            <Tag color="gold">Poker coffee club</Tag>
            <Typography.Title className="site-title">
              Bluffing Coffee
            </Typography.Title>
            <Typography.Paragraph className="site-copy">
              Không gian tournament, live table và cộng đồng thành viên dành cho người chơi yêu poker.
            </Typography.Paragraph>
            <div className="site-actions">
              <AppButton className="site-primary-button" type="primary" size="large" href="/check-in">
                Check-in giải hôm nay
              </AppButton>
              <AppButton className="site-outline-button" size="large" href="#tournaments">
                Xem mẫu giải
              </AppButton>
            </div>
          </div>
        </div>
      </section>

      <section id="tournaments" className="site-section">
        <div>
          <div className="site-section__header">
            <div>
              <Typography.Text className="login-eyebrow">Thông tin giải đấu</Typography.Text>
              <Typography.Title className="site-section__title" level={2}>Mẫu cấu hình giải</Typography.Title>
            </div>
            <Typography.Text className="site-muted">
              Các mẫu giá vé và BP thưởng thường dùng khi quán mở giải.
            </Typography.Text>
          </div>

          <div className="site-grid">
            {rewardProfiles.map((profile) => (
              <article key={profile.code} className="site-card">
                <span className="site-card__icon">
                  {profile.icon}
                </span>
                <Typography.Title className="site-card__title" level={4}>{profile.name}</Typography.Title>
                <Typography.Text className="site-muted">{profile.code}</Typography.Text>
                <div className="site-card__meta">
                  <span className="site-muted">Vé từ {profile.price}</span>
                  <strong className="site-card__reward">{profile.reward}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="site-section site-section--event">
        <div className="site-event">
          <div>
            <Typography.Text className="login-eyebrow">Event</Typography.Text>
            <Typography.Title className="site-section__title" level={2}>Anniversary Event</Typography.Title>
            <Typography.Paragraph className="site-muted">
              Sự kiện đặc biệt với cấu hình thưởng cao hơn, bàn live liên tục và bảng xếp hạng trong ngày.
            </Typography.Paragraph>
          </div>
          <div className="site-event__date">
            <CalendarOutlined />
            <span>Hôm nay</span>
          </div>
        </div>
      </section>

      <section id="posts" className="site-section">
        <div>
          <div className="site-section__header">
            <div>
              <Typography.Text className="login-eyebrow">Bài viết</Typography.Text>
              <Typography.Title className="site-section__title" level={2}>Tin mới từ Bluffing Coffee</Typography.Title>
            </div>
          </div>

          <div className="site-grid">
            {posts.map((post) => (
              <article key={post.title} className="site-card site-card--post">
                <Tag>{post.category}</Tag>
                <Typography.Title className="site-card__title" level={4}>{post.title}</Typography.Title>
                <Typography.Paragraph className="site-muted">{post.excerpt}</Typography.Paragraph>
                <AppButton className="site-link-button" type="link">Đọc thêm</AppButton>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
