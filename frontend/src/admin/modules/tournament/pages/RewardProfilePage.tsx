import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Form, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppCheckbox from '@/shared/components/atoms/AppCheckbox';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTable from '@/shared/components/atoms/AppTable';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  createRewardProfile,
  deleteRewardProfile,
  getRewardProfiles,
  tournamentQueryKeys,
  updateRewardProfile,
} from '@/admin/modules/tournament/api/tournament.api';
import type {
  RewardProfile,
  RewardProfileFormValues,
} from '@/admin/modules/tournament/types/tournament.type';
import { useAppToast } from '@/shared/hooks/use-app-toast';

const defaultFormValues: RewardProfileFormValues = {
  name: '',
  code: '',
  isActive: true,
  defaultPriceWithDrink: 0,
  defaultPriceWithoutDrink: 0,
  items: [
    { position: 1, bpReward: 0 },
    { position: 2, bpReward: 0 },
    { position: 3, bpReward: 0 },
  ],
};

const formatCurrency = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')}đ`;

export function RewardProfilePage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [form] = Form.useForm<RewardProfileFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<RewardProfile | null>(null);

  const { data: rewardProfiles = [], isLoading } = useQuery({
    queryKey: tournamentQueryKeys.rewardProfiles,
    queryFn: getRewardProfiles,
  });

  useEffect(() => {
    if (!modalOpen) return;

    if (editingProfile) {
      form.setFieldsValue({
        name: editingProfile.name,
        code: editingProfile.code,
        isActive: editingProfile.isActive,
        defaultPriceWithDrink: editingProfile.defaultPriceWithDrink,
        defaultPriceWithoutDrink: editingProfile.defaultPriceWithoutDrink,
        items: editingProfile.items
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((item) => ({
            position: item.position,
            bpReward: item.bpReward,
          })),
      });
      return;
    }

    form.setFieldsValue(defaultFormValues);
  }, [editingProfile, form, modalOpen]);

  const invalidateRewardProfiles = async () => {
    await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rewardProfiles });
    await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: createRewardProfile,
    onSuccess: async () => {
      toast.success('Đã tạo reward profile.');
      setModalOpen(false);
      await invalidateRewardProfiles();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: RewardProfileFormValues }) =>
      updateRewardProfile(id, values),
    onSuccess: async () => {
      toast.success('Đã cập nhật reward profile.');
      setModalOpen(false);
      setEditingProfile(null);
      await invalidateRewardProfiles();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRewardProfile,
    onSuccess: async () => {
      toast.success('Đã xóa reward profile.');
      await invalidateRewardProfiles();
    },
  });

  const columns: ColumnsType<RewardProfile> = [
    {
      title: 'Tên profile',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? 'Đang dùng' : 'Tạm tắt'}</Tag>
      ),
    },
    {
      title: 'Giá mặc định',
      key: 'defaultPrices',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>Có đồ uống: {formatCurrency(record.defaultPriceWithDrink)}</span>
          <span>Nước lọc: {formatCurrency(record.defaultPriceWithoutDrink)}</span>
        </Space>
      ),
    },
    {
      title: 'BP theo thứ hạng',
      dataIndex: 'items',
      key: 'items',
      render: (items: RewardProfile['items']) => (
        <Space wrap size={6}>
          {items
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((item) => (
              <Tag key={item.id}>
                Top {item.position}: {item.bpReward.toLocaleString('vi-VN')} BP
              </Tag>
            ))}
        </Space>
      ),
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
                setEditingProfile(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa reward profile"
            description="Các giải đang dùng profile này sẽ bị bỏ liên kết profile."
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

  const handleSubmit = async (values: RewardProfileFormValues) => {
    const payload = {
      ...values,
      isActive: Boolean(values.isActive),
      defaultPriceWithDrink: Number(values.defaultPriceWithDrink),
      defaultPriceWithoutDrink: Number(values.defaultPriceWithoutDrink),
      items: values.items
        .filter((item) => item.position && item.bpReward !== undefined && item.bpReward !== null)
        .map((item) => ({
          position: Number(item.position),
          bpReward: Number(item.bpReward),
        })),
    };

    if (editingProfile) {
      await updateMutation.mutateAsync({ id: editingProfile.id, values: payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProfile(null);
    form.resetFields();
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Cấu hình giải đấu"
        subtitle="Quản lý reward profile để giải đấu tự cộng BP khi finalize."
        extra={
          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProfile(null);
              setModalOpen(true);
            }}
          >
            Thêm profile
          </AppButton>
        }
      />

      <Card>
        <AppTable<RewardProfile>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={rewardProfiles}
          pagination={false}
        />
      </Card>

      <AppModal
        isOpen={modalOpen}
        title={editingProfile ? 'Chỉnh sửa reward profile' : 'Thêm reward profile'}
        onClose={closeModal}
        footer={null}
        maxWidth="max-w-3xl"
      >
        <Form form={form} layout="vertical" initialValues={defaultFormValues} onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tên profile"
            rules={[{ required: true, message: 'Vui lòng nhập tên profile' }]}
          >
            <AppTextField placeholder="Default DeepStack" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Vui lòng nhập code' }]}
          >
            <AppTextField placeholder="DEFAULT_DEEPSTACK" />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <AppCheckbox>Đang sử dụng</AppCheckbox>
          </Form.Item>

          <Form.Item
            name="defaultPriceWithDrink"
            label="Giá mặc định: vé + 1 đồ uống pha + nước lọc"
            rules={[{ required: true, message: 'Vui lòng nhập giá vé có đồ uống pha' }]}
          >
            <AppInputNumber className="w-full" min={0} precision={0} />
          </Form.Item>

          <Form.Item
            name="defaultPriceWithoutDrink"
            label="Giá mặc định: vé + nước lọc"
            rules={[{ required: true, message: 'Vui lòng nhập giá vé nước lọc' }]}
          >
            <AppInputNumber className="w-full" min={0} precision={0} />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={12} className="w-full">
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" size={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'position']}
                      label="Thứ hạng"
                      rules={[{ required: true, message: 'Nhập thứ hạng' }]}
                    >
                      <AppInputNumber min={1} precision={0} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'bpReward']}
                      label="BP thưởng"
                      rules={[{ required: true, message: 'Nhập BP' }]}
                    >
                      <AppInputNumber min={0} precision={0} />
                    </Form.Item>
                    <AppButton danger onClick={() => remove(field.name)}>
                      Xóa
                    </AppButton>
                  </Space>
                ))}
                <AppButton onClick={() => add({ position: fields.length + 1, bpReward: 0 })}>
                  Thêm thứ hạng
                </AppButton>
              </Space>
            )}
          </Form.List>

          <div className="modal-actions">
            <AppButton onClick={closeModal}>Hủy</AppButton>
            <AppButton
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              Lưu
            </AppButton>
          </div>
        </Form>
      </AppModal>
    </div>
  );
}
