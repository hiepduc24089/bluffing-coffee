import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppTable from '@/shared/components/atoms/AppTable';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  dashboardQueryKeys,
  getDashboardSummary,
} from '@/admin/modules/dashboard/api/dashboard.api';
import type { DashboardActivityRow } from '@/admin/modules/dashboard/types/dashboard.type';
import type { TournamentStatus } from '@/admin/modules/tournament/types/tournament.type';
import {
  tournamentStatusColors,
  tournamentStatusLabels,
} from '@/admin/modules/tournament/utils/tournament-status';

const activityColumns: ColumnsType<DashboardActivityRow> = [
  {
    title: 'Giải đấu',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, record) => (
      <div>
        <Typography.Text strong>{name}</Typography.Text>
        <div>
          <Typography.Text type="secondary">{record.startAt ?? 'Chưa đặt lịch'}</Typography.Text>
        </div>
      </div>
    ),
  },
  {
    title: 'Bàn',
    dataIndex: 'tables',
    key: 'tables',
    render: (tables: string[]) => (tables.length > 0 ? tables.join(', ') : '-'),
  },
  {
    title: 'Người chơi',
    key: 'players',
    render: (_, record) =>
      record.capacity ? `${record.registeredCount}/${record.capacity}` : record.registeredCount,
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: TournamentStatus) => (
      <Tag color={tournamentStatusColors[status]}>{tournamentStatusLabels[status]}</Tag>
    ),
  },
];

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: dashboardQueryKeys.summary(),
    queryFn: getDashboardSummary,
  });

  const stats = data?.stats;

  return (
    <div className="page-stack">
      <PageHeader
        title="Tổng quan"
        subtitle="Theo dõi nhanh tình hình giải đấu, bàn chơi và hoạt động khách hàng."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="Bàn đang hoạt động"
              value={stats?.activeLiveTables ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="Giải đấu đang mở"
              value={stats?.openTournaments ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="Người chơi đã đăng ký"
              value={stats?.activeRegistrations ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="Thành viên" value={stats?.totalMembers ?? 0} loading={isLoading} />
          </Card>
        </Col>
      </Row>

      <Card title="Giải đấu gần đây">
        <AppTable<DashboardActivityRow>
          rowKey="id"
          columns={activityColumns}
          dataSource={data?.recentTournaments ?? []}
          loading={isLoading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
