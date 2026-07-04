import { useMemo, useState } from 'react';
import { Form } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type { UserFormValues, UserRow } from '@/admin/modules/user/types/user.type';
import {
  stableSerialize,
  useUnsavedChangesGuard,
} from '@/shared/hooks/use-unsaved-changes-guard';

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
  const watchedValues = Form.useWatch([], form);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const currentSnapshot = useMemo(
    () => stableSerialize(normalizeUserFormValues(form.getFieldsValue(true))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, watchedValues],
  );
  const hasUnsavedChanges = Boolean(open && initialSnapshot && initialSnapshot !== currentSnapshot);
  const confirmUnsavedChanges = useUnsavedChangesGuard({
    enabled: hasUnsavedChanges && !submitting,
  });

  return (
    <AppModal
      isOpen={open}
      title={initialValues ? 'Chỉnh sửa thành viên' : 'Thêm thành viên'}
      onClose={() => confirmUnsavedChanges(onCancel)}
      footer={null}
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          const nextValues = {
            name: initialValues?.name ?? '',
            phone: initialValues?.phone ?? '',
          };

          form.setFieldsValue(nextValues);
          setInitialSnapshot(stableSerialize(normalizeUserFormValues(nextValues)));
        } else {
          form.resetFields();
          setInitialSnapshot('');
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
          <AppButton onClick={() => confirmUnsavedChanges(onCancel)}>Hủy</AppButton>
          <AppButton type="primary" htmlType="submit" loading={submitting}>
            Lưu
          </AppButton>
        </div>
      </Form>
    </AppModal>
  );
}

function normalizeUserFormValues(values: Partial<UserFormValues>) {
  return {
    name: values.name ?? '',
    phone: values.phone ?? '',
  };
}
