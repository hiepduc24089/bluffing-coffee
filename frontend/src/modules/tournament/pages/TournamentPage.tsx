import { useState } from 'react';
import { Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/shared/components/layout/page-header';
import { TournamentFormModal } from '@/modules/tournament/components/tournament-form-modal';
import { useTournamentList } from '@/modules/tournament/hooks/use-tournament-list';
import type {
  TournamentFilter,
  TournamentFormValues,
  TournamentRow,
  TournamentStatus,
} from '@/modules/tournament/types/tournament.type';

const defaultFilters: TournamentFilter = {
  keyword: '',
  page: 1,
  perPage: 10,
};

const statusColors: Record<TournamentStatus, string> = {
  draft: 'default',
  published: 'blue',
  running: 'green',
  completed: 'gold',
};

export function TournamentPage() {
  const [filters, setFilters] = useState<TournamentFilter>(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useTournamentList(filters);

  const columns: ColumnsType<TournamentRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Buy-in',
      dataIndex: 'buyIn',
      key: 'buyIn',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TournamentStatus) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Start At',
      dataIndex: 'startAt',
      key: 'startAt',
    },
  ];

  const handleCreate = async (_values: TournamentFormValues) => {
    setModalOpen(false);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Tournaments"
        subtitle="Manage tournament schedule, buy-in structure, and player capacity."
        extra={
          <Button type="primary" onClick={() => setModalOpen(true)}>
            Create Tournament
          </Button>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <Input.Search
            placeholder="Search tournament"
            allowClear
            onSearch={(keyword) =>
              setFilters((current) => ({
                ...current,
                keyword,
                page: 1,
              }))
            }
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ minWidth: 180 }}
            onChange={(status) =>
              setFilters((current) => ({
                ...current,
                status,
                page: 1,
              }))
            }
            options={[
              { label: 'Draft', value: 'draft' },
              { label: 'Published', value: 'published' },
              { label: 'Running', value: 'running' },
              { label: 'Completed', value: 'completed' },
            ]}
          />
        </Space>

        <Table<TournamentRow>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.data ?? []}
          pagination={{
            current: data?.meta.current_page ?? filters.page,
            pageSize: data?.meta.per_page ?? filters.perPage,
            total: data?.meta.total ?? 0,
            onChange: (page, perPage) =>
              setFilters((current) => ({
                ...current,
                page,
                perPage,
              })),
          }}
        />
      </Card>

      <TournamentFormModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
