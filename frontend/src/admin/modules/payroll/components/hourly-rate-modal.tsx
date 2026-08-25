import { Form, Typography } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppModal from '@/shared/components/atoms/AppModal';
import type { PayrollRow } from '@/admin/modules/payroll/types/payroll.type';

type HourlyRateModalProps = {
  open: boolean;
  row: PayrollRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (hourlyRate: number | null) => void;
};

type FormShape = {
  hourlyRate?: number | null;
};

export function HourlyRateModal({
  open,
  row,
  submitting,
  onCancel,
  onSubmit,
}: HourlyRateModalProps) {
  const [form] = Form.useForm<FormShape>();

  return (
    <AppModal
      isOpen={open}
      title={row ? `Lương giờ — ${row.staff.name}` : 'Lương giờ'}
      onClose={onCancel}
      footer={null}
      maxWidth="max-w-md"
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          form.setFieldsValue({ hourlyRate: row?.hourlyRate ?? null });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form<FormShape>
        form={form}
        layout="vertical"
        onFinish={(values) => onSubmit(values.hourlyRate ?? null)}
      >
        <Form.Item
          name="hourlyRate"
          label="Lương theo giờ (VND)"
          extra="Bỏ trống nếu chưa chốt lương cho bạn này."
        >
          <AppInputNumber
            className="w-full"
            min={0}
            max={100000000}
            step={1000}
            formatter={(value) => (value ? Number(value).toLocaleString('vi-VN') : '')}
            parser={(value) => Number((value ?? '').replace(/\D/g, ''))}
          />
        </Form.Item>

        {row ? (
          <Typography.Paragraph type="secondary">
            Tháng này {row.staff.name} làm {row.shiftCount} ca. Đổi lương giờ sẽ tính lại toàn bộ
            các tháng, vì bảng lương lấy trực tiếp mức lương hiện tại.
          </Typography.Paragraph>
        ) : null}

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
