import { useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Card, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  createGameFormat,
  deleteGameFormat,
  duplicateGameFormat,
  gameFormatQueryKeys,
  updateGameFormat,
} from '@/admin/modules/game-format/api/game-format.api';
import { GameFormatFormModal } from '@/admin/modules/game-format/components/game-format-form-modal';
import { GameFormatLevelTable } from '@/admin/modules/game-format/components/game-format-level-table';
import { useGameFormatList } from '@/admin/modules/game-format/hooks/use-game-format-list';
import type {
  GameFormatFilter,
  GameFormatFormValues,
  GameFormatRow,
  GameFormatTournamentType,
} from '@/admin/modules/game-format/types/game-format.type';
import {
  formatChips,
  formatDuration,
  getTournamentTypeLabel,
  tournamentTypeOptions,
} from '@/admin/modules/game-format/utils/game-format.util';
import { useAppToast } from '@/shared/hooks/use-app-toast';

const defaultFilters: GameFormatFilter = {
  keyword: '',
  page: 1,
  perPage: 10,
};

const tournamentTypeColors: Record<GameFormatTournamentType, string> = {
  normal: 'default',
  deepstack: 'purple',
  turbo: 'volcano',
  sitngo: 'cyan',
};

export function GameFormatPage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [filters, setFilters] = useState<GameFormatFilter>(defaultFilters);
  const [keywordInput, setKeywordInput] = useState(defaultFilters.keyword);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGameFormat, setEditingGameFormat] = useState<GameFormatRow | null>(null);
  const { data, isLoading } = useGameFormatList(filters);

  const invalidateGameFormats = () =>
    queryClient.invalidateQueries({ queryKey: gameFormatQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: createGameFormat,
    onSuccess: async () => {
      toast.success('Đã thêm chế độ chơi.');
      closeModal();
      await invalidateGameFormats();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: GameFormatFormValues }) =>
      updateGameFormat(id, values),
    onSuccess: async () => {
      toast.success('Đã cập nhật chế độ chơi.');
      closeModal();
      await invalidateGameFormats();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateGameFormat,
    onSuccess: async () => {
      toast.success('Đã nhân bản chế độ chơi. Bản sao đang ở trạng thái tạm tắt.');
      await invalidateGameFormats();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGameFormat,
    onSuccess: async () => {
      toast.success('Đã xóa chế độ chơi.');
      await invalidateGameFormats();
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<GameFormatRow> = [
    {
      title: 'Chế độ chơi',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          <Tag>{record.code}</Tag>
        </Space>
      ),
    },
    {
      title: 'Nhóm giải',
      dataIndex: 'tournamentType',
      key: 'tournamentType',
      width: 120,
      render: (value: GameFormatTournamentType) => (
        <Tag color={tournamentTypeColors[value]}>{getTournamentTypeLabel(value)}</Tag>
      ),
    },
    {
      title: 'Stack khởi điểm',
      dataIndex: 'startingStack',
      key: 'startingStack',
      width: 140,
      render: (value: number) => formatChips(value),
    },
    {
      title: 'Cấu trúc',
      key: 'structure',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span>
            {record.levelCount} level · {record.breakCount} break
          </span>
          <Typography.Text type="secondary">
            Ước tính {formatDuration(record.totalDurationMinutes)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Late reg / Rebuy',
      key: 'lateReg',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span>
            {record.lateRegUntilLevel ? `Đến hết level ${record.lateRegUntilLevel}` : 'Không giới hạn'}
          </span>
          <Typography.Text type="secondary">
            {record.maxRebuy === null || record.maxRebuy === undefined
              ? 'Rebuy không giới hạn'
              : `Tối đa ${record.maxRebuy} lần rebuy`}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? 'Đang dùng' : 'Tạm tắt'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Chỉnh sửa">
            <AppButton
              icon={<EditOutlined />}
              onClick={() => {
                setEditingGameFormat(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Nhân bản">
            <AppButton
              icon={<CopyOutlined />}
              loading={duplicateMutation.isPending}
              onClick={() => duplicateMutation.mutate(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa chế độ chơi"
            description="Chỉ xóa được khi chưa có giải đấu nào sử dụng chế độ chơi này."
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

  const applySearch = () =>
    setFilters((current) => ({
      ...current,
      keyword: keywordInput,
      page: 1,
    }));

  const handleSubmit = async (values: GameFormatFormValues) => {
    if (editingGameFormat) {
      await updateMutation.mutateAsync({ id: editingGameFormat.id, values });
      return;
    }

    await createMutation.mutateAsync(values);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingGameFormat(null);
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Chế độ chơi"
        subtitle="Thiết lập cấu trúc blind, stack khởi điểm, late reg và rebuy cho từng thể thức giải."
        extra={
          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingGameFormat(null);
              setModalOpen(true);
            }}
          >
            Thêm chế độ chơi
          </AppButton>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppTextField
            placeholder="Tìm theo tên hoặc mã"
            allowClear
            size="large"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={applySearch}
          />
          <AppSelect
            allowClear
            placeholder="Nhóm giải"
            style={{ minWidth: 180 }}
            options={tournamentTypeOptions}
            value={filters.tournamentType}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                tournamentType: value as GameFormatTournamentType | undefined,
                page: 1,
              }))
            }
          />
          <AppSelect
            allowClear
            placeholder="Trạng thái"
            style={{ minWidth: 160 }}
            options={[
              { label: 'Đang dùng', value: 'active' },
              { label: 'Tạm tắt', value: 'inactive' },
            ]}
            value={
              filters.isActive === undefined ? undefined : filters.isActive ? 'active' : 'inactive'
            }
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                isActive: value === undefined ? undefined : value === 'active',
                page: 1,
              }))
            }
          />
          <AppButton size="large" type="primary" icon={<SearchOutlined />} onClick={applySearch}>
            Tìm kiếm
          </AppButton>
        </Space>

        <AppTable<GameFormatRow>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.data ?? []}
          expandable={{
            expandedRowRender: (record) => <GameFormatLevelTable levels={record.levels} />,
            rowExpandable: (record) => record.levels.length > 0,
          }}
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

      <GameFormatFormModal
        open={modalOpen}
        initialValues={editingGameFormat}
        submitting={isSubmitting}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
