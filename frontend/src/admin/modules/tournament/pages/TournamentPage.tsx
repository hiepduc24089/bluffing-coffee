import { useState } from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Card, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import { TournamentFormModal } from '@/admin/modules/tournament/components/tournament-form-modal';
import {
  createTournament,
  deleteTournament,
  getRewardProfiles,
  tournamentQueryKeys,
  updateTournament,
} from '@/admin/modules/tournament/api/tournament.api';
import { useTournamentList } from '@/admin/modules/tournament/hooks/use-tournament-list';
import type {
  TournamentFilter,
  TournamentFormValues,
  TournamentRow,
  TournamentStatus,
} from '@/admin/modules/tournament/types/tournament.type';
import { useAppToast } from '@/shared/hooks/use-app-toast';

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

const formatCurrency = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')}đ`;

export function TournamentPage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [filters, setFilters] = useState<TournamentFilter>(defaultFilters);
  const [keywordInput, setKeywordInput] = useState(defaultFilters.keyword);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<TournamentRow | null>(null);
  const { data, isLoading } = useTournamentList(filters);
  const { data: rewardProfiles = [] } = useQuery({
    queryKey: tournamentQueryKeys.rewardProfiles,
    queryFn: getRewardProfiles,
  });

  const createMutation = useMutation({
    mutationFn: createTournament,
    onSuccess: async () => {
      toast.success('Đã tạo giải đấu.');
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TournamentFormValues }) => updateTournament(id, values),
    onSuccess: async () => {
      toast.success('Đã cập nhật giải đấu.');
      setModalOpen(false);
      setEditingTournament(null);
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournament,
    onSuccess: async () => {
      toast.success('Đã xóa giải đấu.');
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.all });
    },
  });

  const columns: ColumnsType<TournamentRow> = [
    {
      title: 'Tên giải đấu',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mẫu cấu hình',
      dataIndex: 'rewardProfile',
      key: 'rewardProfile',
      render: (_, record) => record.rewardProfile?.name ?? '-',
    },
    {
      title: 'Vé + đồ uống',
      dataIndex: 'ticketPriceWithDrink',
      key: 'ticketPriceWithDrink',
      render: (value?: number | null) => formatCurrency(value),
    },
    {
      title: 'Vé nước lọc',
      dataIndex: 'ticketPriceWithoutDrink',
      key: 'ticketPriceWithoutDrink',
      render: (value?: number | null) => formatCurrency(value),
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
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Chỉnh sửa">
            <AppButton
              icon={<EditOutlined />}
              onClick={() => {
                setEditingTournament(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa giải đấu"
            description="Giải đấu này và các đăng ký liên quan sẽ bị xóa."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Tooltip title="Xóa">
              <AppButton danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async (values: TournamentFormValues) => {
    if (editingTournament) {
      await updateMutation.mutateAsync({ id: editingTournament.id, values });
      return;
    }

    await createMutation.mutateAsync(values);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTournament(null);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Giải đấu"
        subtitle="Quản lý lịch diễn ra, mẫu cấu hình áp dụng, giá vé và sức chứa người chơi."
        extra={
          <AppButton
            type="primary"
            onClick={() => {
              setEditingTournament(null);
              setModalOpen(true);
            }}
          >
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
        initialValues={editingTournament ?? undefined}
        submitting={createMutation.isPending || updateMutation.isPending}
        rewardProfiles={rewardProfiles}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
