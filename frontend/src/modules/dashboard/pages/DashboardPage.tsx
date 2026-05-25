import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/shared/components/layout/page-header';

type ActivityRow = {
  key: string;
  event: string;
  table: string;
  status: 'Upcoming' | 'Running' | 'Completed';
};

const activityColumns: ColumnsType<ActivityRow> = [
  {
    title: 'Event',
    dataIndex: 'event',
    key: 'event',
  },
  {
    title: 'Table',
    dataIndex: 'table',
    key: 'table',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: ActivityRow['status']) => {
      const colorMap = {
        Upcoming: 'gold',
        Running: 'green',
        Completed: 'default',
      } as const;

      return <Tag color={colorMap[status]}>{status}</Tag>;
    },
  },
];

const activityData: ActivityRow[] = [
  { key: '1', event: 'Friday Deep Stack', table: 'A1', status: 'Running' },
  { key: '2', event: 'Sit & Go Turbo', table: 'B2', status: 'Upcoming' },
  { key: '3', event: 'Weekend Main Event', table: 'VIP', status: 'Completed' },
];

export function DashboardPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard"
        subtitle="Operational snapshot for tournaments, tables, and customer activity."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Active Tables" value={12} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Registered Players" value={148} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Open Tournaments" value={4} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table<ActivityRow>
          rowKey="key"
          columns={activityColumns}
          dataSource={activityData}
          pagination={false}
        />
      </Card>
    </div>
  );
}
