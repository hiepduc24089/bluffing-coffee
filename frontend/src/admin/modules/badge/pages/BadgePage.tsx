import { useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Card, message, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  badgeQueryKeys,
  createBadge,
  deleteBadge,
  updateBadge,
} from '@/admin/modules/badge/api/badge.api';
import { BadgeFormModal } from '@/admin/modules/badge/components/badge-form-modal';
import { useBadgeList } from '@/admin/modules/badge/hooks/use-badge-list';
import type { BadgeFilter, BadgeFormValues, BadgeRow } from '@/admin/modules/badge/types/badge.type';

const defaultFilters: BadgeFilter = {
  keyword: '',
  page: 1,
  perPage: 10,
};

export function BadgePage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BadgeFilter>(defaultFilters);
  const [keywordInput, setKeywordInput] = useState(defaultFilters.keyword);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeRow | null>(null);
  const { data, isLoading } = useBadgeList(filters);

  const invalidateBadges = () => queryClient.invalidateQueries({ queryKey: badgeQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: createBadge,
    onSuccess: async () => {
      message.success('Đã thêm huy hiệu.');
      setModalOpen(false);
      await invalidateBadges();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BadgeFormValues }) => updateBadge(id, values),
    onSuccess: async () => {
      message.success('Đã cập nhật huy hiệu.');
      setModalOpen(false);
      setEditingBadge(null);
      await invalidateBadges();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBadge,
    onSuccess: async () => {
      message.success('Đã xóa huy hiệu.');
      await invalidateBadges();
    },
  });

  const columns: ColumnsType<BadgeRow> = [
    {
      title: 'Tên huy hiệu',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Icon',
      dataIndex: 'icon',
      key: 'icon',
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
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
                setEditingBadge(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa huy hiệu"
            description="Huy hiệu này sẽ bị xóa khỏi danh sách và khỏi các thành viên đã nhận."
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

  const handleSubmit = async (values: BadgeFormValues) => {
    if (editingBadge) {
      await updateMutation.mutateAsync({ id: editingBadge.id, values });
      return;
    }

    await createMutation.mutateAsync(values);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Huy hiệu"
        subtitle="Quản lý các huy hiệu được cấp theo thành tích tournament."
        extra={
          <AppButton type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Thêm huy hiệu
          </AppButton>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppTextField
            placeholder="Tìm theo tên, mã hoặc mô tả"
            allowClear
            size="large"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={applySearch}
          />
          <AppButton size="large" type="primary" icon={<SearchOutlined />} onClick={applySearch}>
            Tìm kiếm
          </AppButton>
        </Space>

        <AppTable<BadgeRow>
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

      <BadgeFormModal
        open={modalOpen}
        initialValues={editingBadge}
        submitting={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditingBadge(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
