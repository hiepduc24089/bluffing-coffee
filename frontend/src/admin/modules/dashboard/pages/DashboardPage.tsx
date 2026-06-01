import { Card, Col, Row, Statistic, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AppTable from '@/shared/components/atoms/AppTable';
import { PageHeader } from '@/shared/components/layout/page-header';

type ActivityRow = {
  key: string;
  event: string;
  table: string;
  status: 'upcoming' | 'running' | 'completed';
};

const activityColumns: ColumnsType<ActivityRow> = [
  {
    title: 'Sự kiện',
    dataIndex: 'event',
    key: 'event',
  },
  {
    title: 'Bàn',
    dataIndex: 'table',
    key: 'table',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: ActivityRow['status']) => {
      const colorMap = {
        upcoming: 'gold',
        running: 'green',
        completed: 'default',
      } as const;
      const labelMap = {
        upcoming: 'Sắp diễn ra',
        running: 'Đang diễn ra',
        completed: 'Đã hoàn tất',
      } as const;

      return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
    },
  },
];

const activityData: ActivityRow[] = [
  { key: '1', event: 'Giải tối thứ sáu', table: 'A1', status: 'running' },
  { key: '2', event: 'Giải nhanh', table: 'B2', status: 'upcoming' },
  { key: '3', event: 'Giải cuối tuần', table: 'VIP', status: 'completed' },
];

export function DashboardPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Tổng quan"
        subtitle="Theo dõi nhanh tình hình giải đấu, bàn chơi và hoạt động khách hàng."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Bàn đang hoạt động" value={12} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Người chơi đã đăng ký" value={148} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Giải đấu đang mở" value={4} />
          </Card>
        </Col>
      </Row>

      <Card>
        <AppTable<ActivityRow>
          rowKey="key"
          columns={activityColumns}
          dataSource={activityData}
          pagination={false}
        />
      </Card>
    </div>
  );
}
