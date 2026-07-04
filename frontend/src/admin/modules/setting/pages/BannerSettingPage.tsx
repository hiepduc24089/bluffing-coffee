import { useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Card, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  createBanner,
  deleteBanner,
  getBanners,
  settingQueryKeys,
  updateBanner,
} from '@/admin/modules/setting/api/setting.api';
import { BannerFormModal } from '@/admin/modules/setting/components/banner-form-modal';
import type { BannerFilter, BannerFormValues, BannerRow } from '@/admin/modules/setting/types/setting.type';
import { useAppToast } from '@/shared/hooks/use-app-toast';

export function BannerSettingPage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [filters, setFilters] = useState<BannerFilter>({
    keyword: '',
    page: 1,
    perPage: 10,
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: settingQueryKeys.banners(filters),
    queryFn: () => getBanners(filters),
  });

  const invalidateBanners = () => queryClient.invalidateQueries({ queryKey: settingQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: createBanner,
    onSuccess: async () => {
      toast.success('Đã thêm banner.');
      setModalOpen(false);
      await invalidateBanners();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: BannerFormValues }) => updateBanner(id, values),
    onSuccess: async () => {
      toast.success('Đã cập nhật banner.');
      setModalOpen(false);
      setEditingBanner(null);
      await invalidateBanners();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: async () => {
      toast.success('Đã xóa banner.');
      await invalidateBanners();
    },
  });

  const columns: ColumnsType<BannerRow> = [
    {
      title: 'Ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 180,
      render: (_, record) => <img className="setting-banner-table-thumb" src={record.imageUrl ?? record.image} alt="" />,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Link',
      dataIndex: 'linkUrl',
      key: 'linkUrl',
      ellipsis: true,
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 100,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? 'Đang bật' : 'Đang tắt'}</Tag>,
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
                setEditingBanner(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa banner"
            description="Banner này sẽ bị xóa khỏi hệ thống."
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

  const handleSubmit = async (values: BannerFormValues) => {
    if (editingBanner) {
      await updateMutation.mutateAsync({ id: editingBanner.id, values });
      return;
    }

    await createMutation.mutateAsync(values);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Banner"
        subtitle="Quản lý nhiều ảnh banner hiển thị trên website hoặc các khu vực truyền thông."
        extra={
          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingBanner(null);
              setModalOpen(true);
            }}
          >
            Thêm banner
          </AppButton>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppTextField
            placeholder="Tìm theo tiêu đề hoặc link"
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

        <AppTable<BannerRow>
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

      <BannerFormModal
        open={modalOpen}
        initialValues={editingBanner}
        submitting={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditingBanner(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
