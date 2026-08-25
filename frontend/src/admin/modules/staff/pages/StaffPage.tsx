import { useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyOutlined, SearchOutlined } from '@ant-design/icons';
import { Card, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  createStaff,
  deleteStaff,
  getStaffList,
  staffQueryKeys,
  updateStaff,
  updateStaffPermissions,
} from '@/admin/modules/staff/api/staff.api';
import { StaffFormModal } from '@/admin/modules/staff/components/staff-form-modal';
import { StaffPermissionModal } from '@/admin/modules/staff/components/staff-permission-modal';
import type {
  StaffFilter,
  StaffFormValues,
  StaffRow,
} from '@/admin/modules/staff/types/staff.type';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { useAdminPermissions } from '@/admin/modules/auth/hooks/use-admin-permissions';

const defaultFilters: StaffFilter = {
  keyword: '',
  page: 1,
  perPage: 10,
};

export function StaffPage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const { can } = useAdminPermissions();
  const canEditHourlyRate = can('special.view_all_payroll');
  const [filters, setFilters] = useState<StaffFilter>(defaultFilters);
  const [keywordInput, setKeywordInput] = useState(defaultFilters.keyword);
  const [formOpen, setFormOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: staffQueryKeys.list(filters),
    queryFn: () => getStaffList(filters),
  });

  const invalidateStaff = () => queryClient.invalidateQueries({ queryKey: staffQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: async () => {
      toast.success('Đã thêm nhân viên.');
      closeForm();
      await invalidateStaff();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: StaffFormValues }) => updateStaff(id, values),
    onSuccess: async () => {
      toast.success('Đã cập nhật nhân viên.');
      closeForm();
      await invalidateStaff();
    },
  });

  const permissionMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) =>
      updateStaffPermissions(id, permissions),
    onSuccess: async () => {
      toast.success('Đã cập nhật quyền.');
      setPermissionOpen(false);
      setEditingStaff(null);
      await invalidateStaff();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: async () => {
      toast.success('Đã xóa nhân viên.');
      await invalidateStaff();
    },
  });

  const columns: ColumnsType<StaffRow> = [
    {
      title: 'Nhân viên',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Vị trí',
      key: 'position',
      width: 170,
      render: (_, record) => {
        if (!record.position) {
          return <Typography.Text type="secondary">Không xếp ca</Typography.Text>;
        }

        return (
          <Space direction="vertical" size={2}>
            <Tag color={record.position === 'barista' ? 'cyan' : 'orange'}>
              {record.positionLabel}
            </Tag>
            {record.hourlyRate == null ? null : (
              <Typography.Text type="secondary">
                {record.hourlyRate.toLocaleString('vi-VN')}đ/giờ
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Quyền',
      key: 'permissions',
      render: (_, record) => {
        if (record.isSuperAdmin) {
          return <Tag color="gold">Chủ quán — toàn quyền</Tag>;
        }

        if (!record.permissions.length) {
          return <Typography.Text type="secondary">Chưa cấp quyền</Typography.Text>;
        }

        return <Tag color="blue">{record.permissions.length} quyền</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 170,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title={record.isSuperAdmin ? 'Không sửa được tài khoản chủ quán' : 'Phân quyền'}>
            <AppButton
              icon={<SafetyOutlined />}
              disabled={record.isSuperAdmin}
              onClick={() => {
                setEditingStaff(record);
                setPermissionOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <AppButton
              icon={<EditOutlined />}
              disabled={record.isSuperAdmin}
              onClick={() => {
                setEditingStaff(record);
                setFormOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa nhân viên"
            description="Tài khoản này sẽ không đăng nhập được nữa."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            disabled={record.isSuperAdmin}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Tooltip title="Xóa">
              <AppButton
                danger
                icon={<DeleteOutlined />}
                disabled={record.isSuperAdmin}
                loading={deleteMutation.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const applySearch = () =>
    setFilters((current) => ({ ...current, keyword: keywordInput, page: 1 }));

  function closeForm() {
    setFormOpen(false);
    setEditingStaff(null);
  }

  const handleSubmit = async (values: StaffFormValues) => {
    if (editingStaff) {
      await updateMutation.mutateAsync({ id: editingStaff.id, values });
      return;
    }

    await createMutation.mutateAsync(values);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Nhân viên"
        subtitle="Tạo tài khoản cho nhân viên và chọn module, thao tác mà họ được phép dùng."
        extra={
          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingStaff(null);
              setFormOpen(true);
            }}
          >
            Thêm nhân viên
          </AppButton>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppTextField
            placeholder="Tìm theo tên hoặc email"
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

        <AppTable<StaffRow>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.data ?? []}
          pagination={{
            current: data?.meta.current_page ?? filters.page,
            pageSize: data?.meta.per_page ?? filters.perPage,
            total: data?.meta.total ?? 0,
            onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
          }}
        />
      </Card>

      <StaffFormModal
        open={formOpen}
        canEditHourlyRate={canEditHourlyRate}
        initialValues={editingStaff}
        submitting={createMutation.isPending || updateMutation.isPending}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />

      <StaffPermissionModal
        open={permissionOpen}
        staff={editingStaff}
        submitting={permissionMutation.isPending}
        onCancel={() => {
          setPermissionOpen(false);
          setEditingStaff(null);
        }}
        onSubmit={async (permissions) => {
          if (!editingStaff) return;

          await permissionMutation.mutateAsync({ id: editingStaff.id, permissions });
        }}
      />
    </div>
  );
}
