import { useState } from 'react';
import {
  ClockCircleOutlined,
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
  createTournamentTemplate,
  deleteTournamentTemplate,
  tournamentTemplateQueryKeys,
  updateTournamentTemplate,
} from '@/admin/modules/tournament-template/api/tournament-template.api';
import { TournamentTemplateFormModal } from '@/admin/modules/tournament-template/components/tournament-template-form-modal';
import { TournamentTemplateLevelTable } from '@/admin/modules/tournament-template/components/tournament-template-level-table';
import { useTournamentTemplateList } from '@/admin/modules/tournament-template/hooks/use-tournament-template-list';
import type {
  TournamentTemplateFilter,
  TournamentTemplateFormValues,
  TournamentTemplateRow,
  TournamentTypeValue,
} from '@/admin/modules/tournament-template/types/tournament-template.type';
import {
  ALL_TOURNAMENT_TYPES,
  formatChips,
  formatCurrency,
  formatDuration,
  getTournamentTypeLabel,
  tournamentTypeFilterOptions,
} from '@/admin/modules/tournament-template/utils/tournament-template.util';
import { useAdminPermissions } from '@/admin/modules/auth/hooks/use-admin-permissions';
import { useAppToast } from '@/shared/hooks/use-app-toast';

const defaultFilters: TournamentTemplateFilter = {
  keyword: '',
  page: 1,
  perPage: 10,
};

const tournamentTypeColors: Record<TournamentTypeValue, string> = {
  normal: 'default',
  deepstack: 'purple',
  turbo: 'volcano',
  sitngo: 'cyan',
};

export function TournamentTemplatePage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const { can } = useAdminPermissions();
  const [filters, setFilters] = useState<TournamentTemplateFilter>(defaultFilters);
  const [keywordInput, setKeywordInput] = useState(defaultFilters.keyword);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TournamentTemplateRow | null>(null);
  const { data, isLoading } = useTournamentTemplateList(filters);

  const invalidateTemplates = () =>
    queryClient.invalidateQueries({ queryKey: tournamentTemplateQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: createTournamentTemplate,
    onSuccess: async () => {
      toast.success('Đã thêm mẫu giải đấu.');
      closeModal();
      await invalidateTemplates();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: TournamentTemplateFormValues }) =>
      updateTournamentTemplate(id, values),
    onSuccess: async () => {
      toast.success('Đã cập nhật mẫu giải đấu.');
      closeModal();
      await invalidateTemplates();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournamentTemplate,
    onSuccess: async () => {
      toast.success('Đã xóa mẫu giải đấu.');
      await invalidateTemplates();
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<TournamentTemplateRow> = [
    {
      title: 'Mẫu giải đấu',
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
      render: (value: TournamentTypeValue) => (
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
      title: 'Late reg',
      key: 'lateReg',
      width: 170,
      render: (_, record) =>
        record.lateRegUntilLevel ? `Đến hết level ${record.lateRegUntilLevel}` : 'Không giới hạn',
    },
    {
      title: 'Giá vé',
      key: 'prices',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span>{formatCurrency(record.defaultPriceWithDrink)} · kèm nước</span>
          <Typography.Text type="secondary">
            {formatCurrency(record.defaultPriceWithoutDrink)} · nước lọc
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'BP thưởng',
      key: 'rewards',
      width: 180,
      render: (_, record) =>
        record.rewards.length ? (
          <Space size={4} wrap>
            {record.rewards
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((reward) => (
                <Tag key={reward.id}>
                  #{reward.position}: {reward.bpReward} BP
                </Tag>
              ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">Chưa cấu hình</Typography.Text>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 190,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Mở màn hình đồng hồ">
            <AppButton
              icon={<ClockCircleOutlined />}
              href={`/clock/${record.code}`}
              target="_blank"
              rel="noreferrer"
              disabled={!record.levels.length}
            />
          </Tooltip>
          {can('tournament_template.update') && (
            <Tooltip title="Chỉnh sửa">
              <AppButton
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingTemplate(record);
                  setModalOpen(true);
                }}
              />
            </Tooltip>
          )}
          {can('tournament_template.delete') && (
          <Popconfirm
            title="Xóa mẫu giải đấu"
            description="Chỉ xóa được khi chưa có giải đấu nào sử dụng mẫu này."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Tooltip title="Xóa">
              <AppButton danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
            </Tooltip>
          </Popconfirm>
          )}
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

  const handleSubmit = async (values: TournamentTemplateFormValues) => {
    if (editingTemplate) {
      await updateMutation.mutateAsync({ id: editingTemplate.id, values });
      return;
    }

    await createMutation.mutateAsync(values);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingTemplate(null);
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Mẫu giải đấu"
        subtitle="Cấu trúc blind, stack khởi điểm, late reg, giá vé và BP thưởng gộp chung trong một mẫu."
        extra={
          can('tournament_template.create') ? (
            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTemplate(null);
                setModalOpen(true);
              }}
            >
              Thêm mẫu giải đấu
            </AppButton>
          ) : null
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
            placeholder="Nhóm giải"
            style={{ minWidth: 180 }}
            options={tournamentTypeFilterOptions}
            value={filters.tournamentType ?? ALL_TOURNAMENT_TYPES}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                tournamentType:
                  value === ALL_TOURNAMENT_TYPES ? undefined : (value as TournamentTypeValue),
                page: 1,
              }))
            }
          />
          <AppButton size="large" type="primary" icon={<SearchOutlined />} onClick={applySearch}>
            Tìm kiếm
          </AppButton>
        </Space>

        <AppTable<TournamentTemplateRow>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.data ?? []}
          expandable={{
            expandedRowRender: (record) => <TournamentTemplateLevelTable levels={record.levels} />,
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

      <TournamentTemplateFormModal
        open={modalOpen}
        initialValues={editingTemplate}
        submitting={isSubmitting}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
