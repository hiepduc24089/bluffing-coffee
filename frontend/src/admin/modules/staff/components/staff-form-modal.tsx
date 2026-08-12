import { Form } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type { StaffFormValues, StaffRow } from '@/admin/modules/staff/types/staff.type';

type StaffFormModalProps = {
  open: boolean;
  initialValues?: StaffRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: StaffFormValues) => Promise<void> | void;
};

export function StaffFormModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: StaffFormModalProps) {
  const [form] = Form.useForm<StaffFormValues>();
  const isEditing = Boolean(initialValues);

  return (
    <AppModal
      isOpen={open}
      title={isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
      onClose={onCancel}
      footer={null}
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          form.setFieldsValue({
            name: initialValues?.name ?? '',
            email: initialValues?.email ?? '',
            password: '',
          });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form<StaffFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) =>
          onSubmit({
            name: values.name,
            email: values.email,
            password: values.password || null,
          })
        }
      >
        <Form.Item
          name="name"
          label="Tên nhân viên"
          rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên' }]}
        >
          <AppTextField placeholder="Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email đăng nhập"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <AppTextField placeholder="nhanvien@bluffing.coffee" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          extra={isEditing ? 'Bỏ trống nếu không đổi mật khẩu.' : undefined}
          rules={
            isEditing
              ? [{ min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' }]
              : [
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
                ]
          }
        >
          <AppTextField type="password" autoComplete="new-password" />
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
