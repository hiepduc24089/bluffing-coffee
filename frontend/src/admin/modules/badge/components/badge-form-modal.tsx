import { Form } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTextArea from '@/shared/components/atoms/AppTextArea';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type { BadgeFormValues, BadgeRow } from '@/admin/modules/badge/types/badge.type';

const systemBadgeOptions = [
  {
    value: 'FIRST_WIN',
    label: 'FIRST_WIN - Thắng giải đầu tiên',
    name: 'First Win',
    description: 'Won the first tournament.',
  },
  {
    value: 'CHAMPION',
    label: 'CHAMPION - Vô địch một giải',
    name: 'Champion',
    description: 'Won a tournament.',
  },
  {
    value: 'TEN_TOURNAMENTS',
    label: 'TEN_TOURNAMENTS - Chơi 10 giải',
    name: '10 Tournaments',
    description: 'Played 10 tournaments.',
  },
  {
    value: 'DEEPSTACK_WINNER',
    label: 'DEEPSTACK_WINNER - Thắng DeepStack',
    name: 'DeepStack Winner',
    description: 'Won a DeepStack event.',
  },
  {
    value: 'TURBO_KING',
    label: 'TURBO_KING - Thắng Turbo',
    name: 'Turbo King',
    description: 'Won a Turbo event.',
  },
  {
    value: 'SITNGO_REGULAR',
    label: 'SITNGO_REGULAR - Người chơi Sit & Go',
    name: 'Sit & Go Regular',
    description: 'A regular Sit & Go player.',
  },
];

type BadgeFormModalProps = {
  open: boolean;
  initialValues?: BadgeRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: BadgeFormValues) => Promise<void> | void;
};

export function BadgeFormModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: BadgeFormModalProps) {
  const [form] = Form.useForm<BadgeFormValues>();

  return (
    <AppModal
      isOpen={open}
      title={initialValues ? 'Chỉnh sửa huy hiệu' : 'Thêm huy hiệu'}
      onClose={onCancel}
      footer={null}
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          form.setFieldsValue({
            name: initialValues?.name ?? '',
            code: initialValues?.code ?? '',
            icon: initialValues?.icon ?? '',
            description: initialValues?.description ?? '',
          });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form<BadgeFormValues>
        form={form}
        layout="vertical"
        requiredMark
        onFinish={(values) =>
          onSubmit({
            ...values,
            icon: values.icon || null,
            description: values.description || null,
          })
        }
      >
        <Form.Item
          name="name"
          label="Tên huy hiệu"
          rules={[{ required: true, message: 'Vui lòng nhập tên huy hiệu' }]}
        >
          <AppTextField placeholder="First Win" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã huy hiệu"
          extra="Mã huy hiệu là mã hệ thống dùng để tự động cấp badge theo thành tích."
          rules={[{ required: true, message: 'Vui lòng chọn mã huy hiệu' }]}
        >
          <AppSelect
            showSearch
            placeholder="Chọn mã huy hiệu"
            disabled={Boolean(initialValues?.isSystem)}
            options={systemBadgeOptions}
            onChange={(value) => {
              const option = systemBadgeOptions.find((item) => item.value === value);

              if (!option) return;

              form.setFieldsValue({
                name: option.name,
                description: option.description,
              });
            }}
          />
        </Form.Item>

        <Form.Item name="icon" label="Icon">
          <AppTextField placeholder="Tên icon hoặc URL icon" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <AppTextArea rows={4} placeholder="Mô tả điều kiện hoặc ý nghĩa của huy hiệu" />
        </Form.Item>

        <div className="modal-actions">
          <AppButton onClick={onCancel}>Hủy</AppButton>
          <AppButton type="primary" htmlType="submit" loading={submitting}>
            Lưu
          </AppButton>
        </div>
      </Form>
    </AppModal>
  );
}
