import { Form } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTextArea from '@/shared/components/atoms/AppTextArea';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type { BadgeFormValues, BadgeRow } from '@/admin/modules/badge/types/badge.type';

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
          extra="Các mã đang được hệ thống tự cấp gồm FIRST_WIN, CHAMPION, TEN_TOURNAMENTS, DEEPSTACK_WINNER, TURBO_KING."
          rules={[{ required: true, message: 'Vui lòng nhập mã huy hiệu' }]}
        >
          <AppTextField placeholder="FIRST_WIN" />
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
