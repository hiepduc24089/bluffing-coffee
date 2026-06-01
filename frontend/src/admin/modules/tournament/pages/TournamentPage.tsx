import { useState } from 'react';
import { Card, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import { TournamentFormModal } from '@/admin/modules/tournament/components/tournament-form-modal';
import { useTournamentList } from '@/admin/modules/tournament/hooks/use-tournament-list';
import type {
  TournamentFilter,
  TournamentFormValues,
  TournamentRow,
  TournamentStatus,
} from '@/admin/modules/tournament/types/tournament.type';

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

const statusLabels: Record<TournamentStatus, string> = {
  draft: 'Bản nháp',
  published: 'Đã công bố',
  running: 'Đang diễn ra',
  completed: 'Đã hoàn tất',
};

export function TournamentPage() {
  const [filters, setFilters] = useState<TournamentFilter>(defaultFilters);
  const [keywordInput, setKeywordInput] = useState(defaultFilters.keyword);
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useTournamentList(filters);

  const columns: ColumnsType<TournamentRow> = [
    {
      title: 'Tên giải đấu',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Phí tham gia',
      dataIndex: 'buyIn',
      key: 'buyIn',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: TournamentStatus) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: 'Thời gian bắt đầu',
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
        title="Giải đấu"
        subtitle="Quản lý lịch giải đấu, phí tham gia và sức chứa người chơi."
        extra={
          <AppButton type="primary" onClick={() => setModalOpen(true)}>
            Tạo giải đấu
          </AppButton>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppTextField
            placeholder="Tìm kiếm giải đấu"
            allowClear
            size="large"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() =>
              setFilters((current) => ({
                ...current,
                keyword: keywordInput,
                page: 1,
              }))
            }
          />
          <AppButton
            size="large"
            type="primary"
            onClick={() =>
              setFilters((current) => ({
                ...current,
                keyword: keywordInput,
                page: 1,
              }))
            }
          >
            Tìm kiếm
          </AppButton>
          <AppSelect
            placeholder="Trạng thái"
            allowClear
            style={{ minWidth: 180 }}
            onChange={(status) =>
              setFilters((current) => ({
                ...current,
                status: status as TournamentStatus | undefined,
                page: 1,
              }))
            }
            options={[
              { label: 'Bản nháp', value: 'draft' },
              { label: 'Đã công bố', value: 'published' },
              { label: 'Đang diễn ra', value: 'running' },
              { label: 'Đã hoàn tất', value: 'completed' },
            ]}
          />
        </Space>

        <AppTable<TournamentRow>
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
