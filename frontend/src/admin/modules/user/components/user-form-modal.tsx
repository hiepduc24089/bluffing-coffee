import { Form } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type { UserFormValues, UserRow } from '@/admin/modules/user/types/user.type';

type UserFormModalProps = {
  open: boolean;
  initialValues?: UserRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
};

export function UserFormModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: UserFormModalProps) {
  const [form] = Form.useForm<UserFormValues>();

  return (
    <AppModal
      isOpen={open}
      title={initialValues ? 'Chỉnh sửa thành viên' : 'Thêm thành viên'}
      onClose={onCancel}
      footer={null}
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          form.setFieldsValue({
            name: initialValues?.name ?? '',
            phone: initialValues?.phone ?? '',
          });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form<UserFormValues>
        form={form}
        layout="vertical"
        requiredMark
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label="Tên Thành Viên"
          rules={[{ required: true, message: 'Vui lòng nhập tên thành viên' }]}
        >
          <AppTextField placeholder="Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
        >
          <AppTextField placeholder="0900000001" />
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
