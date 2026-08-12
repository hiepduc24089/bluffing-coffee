import { useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Card, Popconfirm, Space, Tooltip } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  createContentPage,
  deleteContentPage,
  getContentPages,
  settingQueryKeys,
  updateContentPage,
} from '@/admin/modules/setting/api/setting.api';
import { ContentPageFormModal } from '@/admin/modules/setting/components/content-page-form-modal';
import type {
  ContentPageFilter,
  ContentPageFormValues,
  ContentPageRow,
  ContentPageType,
} from '@/admin/modules/setting/types/setting.type';
import { useAdminPermissions } from '@/admin/modules/auth/hooks/use-admin-permissions';
import { useAppToast } from '@/shared/hooks/use-app-toast';

type ContentPageSettingPageProps = {
  type: ContentPageType;
  title: string;
  subtitle: string;
};

function stripHtml(value?: string | null) {
  if (!value) return '-';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '-';
}

export function ContentPageSettingPage({ type, title, subtitle }: ContentPageSettingPageProps) {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const { can } = useAdminPermissions();
  const [filters, setFilters] = useState<ContentPageFilter>({
    type,
    keyword: '',
    page: 1,
    perPage: 10,
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPageRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: settingQueryKeys.contentPages(filters),
    queryFn: () => getContentPages(filters),
  });

  const invalidatePages = () => queryClient.invalidateQueries({ queryKey: settingQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: createContentPage,
    onSuccess: async () => {
      toast.success(`Đã tạo ${title.toLowerCase()}.`);
      setModalOpen(false);
      await invalidatePages();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ContentPageFormValues }) => updateContentPage(id, values),
    onSuccess: async () => {
      toast.success(`Đã cập nhật ${title.toLowerCase()}.`);
      setModalOpen(false);
      setEditingPage(null);
      await invalidatePages();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContentPage,
    onSuccess: async () => {
      toast.success(`Đã xóa ${title.toLowerCase()}.`);
      await invalidatePages();
    },
  });

  const columns: ColumnsType<ContentPageRow> = [
    {
      title: 'Ảnh',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 120,
      render: (_, record) =>
        record.coverImageUrl ? <img className="setting-table-thumb" src={record.coverImageUrl} alt="" /> : '-',
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (value?: string | null) => stripHtml(value),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size={8}>
          {can('setting.update') && (
            <Tooltip title="Chỉnh sửa">
              <AppButton
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingPage(record);
                  setModalOpen(true);
                }}
              />
            </Tooltip>
          )}
          {can('setting.delete') && (
          <Popconfirm
            title={`Xóa ${title.toLowerCase()}`}
            description="Nội dung này sẽ bị xóa khỏi hệ thống."
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
      type,
      keyword: keywordInput,
      page: 1,
    }));

  const handleSubmit = async (values: ContentPageFormValues) => {
    if (editingPage) {
      await updateMutation.mutateAsync({ id: editingPage.id, values: { ...values, type } });
      return;
    }

    await createMutation.mutateAsync({ ...values, type });
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={title}
        subtitle={subtitle}
        extra={
          can('setting.create') ? (
            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPage(null);
                setModalOpen(true);
              }}
            >
              Tạo {title.toLowerCase()}
            </AppButton>
          ) : null
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppTextField
            placeholder="Tìm theo tiêu đề hoặc nội dung"
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

        <AppTable<ContentPageRow>
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
                type,
                page,
                perPage,
              })),
          }}
        />
      </Card>

      <ContentPageFormModal
        open={modalOpen}
        type={type}
        title={title}
        initialValues={editingPage}
        submitting={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditingPage(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
