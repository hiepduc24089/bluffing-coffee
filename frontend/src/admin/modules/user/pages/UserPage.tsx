import { useState } from 'react';
import { DeleteOutlined, EditOutlined, EyeOutlined, KeyOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Card, Popconfirm, Space, Tooltip } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  createUser,
  deleteUser,
  resetUserPassword,
  updateUser,
  userQueryKeys,
} from '@/admin/modules/user/api/user.api';
import { UserFormModal } from '@/admin/modules/user/components/user-form-modal';
import { useUserList } from '@/admin/modules/user/hooks/use-user-list';
import type { UserFilter, UserFormValues, UserRow } from '@/admin/modules/user/types/user.type';
import { useAppToast } from '@/shared/hooks/use-app-toast';

const defaultFilters: UserFilter = {
  keyword: '',
  page: 1,
  perPage: 10,
};

export function UserPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useAppToast();
  const [filters, setFilters] = useState<UserFilter>(defaultFilters);
  const [keywordInput, setKeywordInput] = useState(defaultFilters.keyword);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const { data, isLoading } = useUserList(filters);

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: userQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      toast.success('Đã thêm thành viên. Password mặc định là số điện thoại.');
      setModalOpen(false);
      await invalidateUsers();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) => updateUser(id, values),
    onSuccess: async () => {
      toast.success('Đã cập nhật thành viên.');
      setModalOpen(false);
      setEditingUser(null);
      await invalidateUsers();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      toast.success('Đã xóa thành viên.');
      await invalidateUsers();
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
  });

  const columns: ColumnsType<UserRow> = [
    {
      title: 'Tên Thành Viên',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record) => (
        <AppButton type="link" onClick={() => navigate(`/admin/users/${record.id}`)}>
          {value}
        </AppButton>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'BP',
      dataIndex: 'bpBalance',
      key: 'bpBalance',
      align: 'right',
      render: (value?: number) => (value ?? 0).toLocaleString('vi-VN'),
    },
    {
      title: 'Rank',
      dataIndex: 'rankLevel',
      key: 'rankLevel',
      render: (value?: string | null) => value ?? '-',
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
      width: 190,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Chỉnh sửa">
            <AppButton
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUser(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <AppButton icon={<EyeOutlined />} onClick={() => navigate(`/admin/users/${record.id}`)} />
          </Tooltip>
          <Popconfirm
            title="Reset password"
            description="Password mới sẽ là số điện thoại hiện tại của thành viên."
            okText="Reset"
            cancelText="Hủy"
            onConfirm={() => resetPasswordMutation.mutate(record.id)}
          >
            <Tooltip title="Reset password">
              <AppButton icon={<KeyOutlined />} loading={resetPasswordMutation.isPending} />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Xóa thành viên"
            description="Thành viên này sẽ bị xóa khỏi hệ thống."
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

  const handleSubmit = async (values: UserFormValues) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, values });
      return;
    }

    await createMutation.mutateAsync(values);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Thành viên"
        subtitle="Quản lý thành viên đăng nhập bằng số điện thoại và mật khẩu."
        extra={
          <AppButton type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Thêm thành viên
          </AppButton>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppTextField
            placeholder="Tìm theo tên hoặc số điện thoại"
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

        <AppTable<UserRow>
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

      <UserFormModal
        open={modalOpen}
        initialValues={editingUser}
        submitting={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
