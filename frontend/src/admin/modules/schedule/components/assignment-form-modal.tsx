import { Alert, Form, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import { DeleteOutlined } from '@ant-design/icons';
import AppButton from '@/shared/components/atoms/AppButton';
import AppDatePicker from '@/shared/components/atoms/AppDatePicker';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { ALL_SLOTS, SLOT_LABELS } from '@/admin/modules/schedule/utils/schedule.util';
import type {
  SchedulableStaff,
  ShiftAssignment,
  ShiftAssignmentFormValues,
  ShiftSlot,
} from '@/admin/modules/schedule/types/schedule.type';

type AssignmentFormModalProps = {
  open: boolean;
  staff: SchedulableStaff[];
  editing: ShiftAssignment | null;
  defaultDate: string;
  defaultSlot: ShiftSlot;
  submitting?: boolean;
  deleting?: boolean;
  /** Ca thuộc tháng đã thanh toán lương: chỉ xem, mọi ô nhập đều khóa. */
  readOnly?: boolean;
  onCancel: () => void;
  onSubmit: (values: ShiftAssignmentFormValues) => void;
  onDelete?: () => void;
};

type FormShape = {
  staffId: number;
  workDate: dayjs.Dayjs;
  slot: ShiftSlot;
  note?: string;
};

export function AssignmentFormModal({
  open,
  staff,
  editing,
  defaultDate,
  defaultSlot,
  submitting,
  deleting,
  readOnly = false,
  onCancel,
  onSubmit,
  onDelete,
}: AssignmentFormModalProps) {
  const [form] = Form.useForm<FormShape>();

  const slotOptions = ALL_SLOTS.map((slot) => ({
    value: slot,
    label: SLOT_LABELS[slot],
  }));

  return (
    <AppModal
      isOpen={open}
      title={readOnly ? 'Chi tiết ca' : editing ? 'Chỉnh sửa ca' : 'Thêm ca'}
      onClose={onCancel}
      footer={null}
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          form.setFieldsValue({
            staffId: editing?.staff.id ?? staff[0]?.id,
            workDate: dayjs(editing?.workDate ?? defaultDate),
            slot: editing?.slot ?? defaultSlot,
            note: editing?.note ?? '',
          });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form<FormShape>
        form={form}
        layout="vertical"
        disabled={readOnly}
        onFinish={(values) =>
          onSubmit({
            staffId: values.staffId,
            workDate: values.workDate.format('YYYY-MM-DD'),
            slot: values.slot,
            note: values.note || null,
          })
        }
      >
        {readOnly ? (
          <Alert
            className="assignment-form__locked"
            type="info"
            showIcon
            message="Ca đã khóa"
            description="Lương tháng chứa ca này đã được thanh toán nên giờ công không sửa được nữa. Muốn sửa thì hủy thanh toán ở màn Bảng lương trước."
          />
        ) : null}

        <Form.Item
          name="staffId"
          label="Nhân viên"
          rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
        >
          <AppSelect
            showSearch
            optionFilterProp="label"
            options={staff.map((member) => ({
              value: member.id,
              label: `${member.name} — ${member.positionLabel ?? 'Chưa có vị trí'}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="workDate"
          label="Ngày làm"
          rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
        >
          <AppDatePicker className="w-full" />
        </Form.Item>

        <Form.Item
          name="slot"
          label="Khung ca"
          rules={[{ required: true, message: 'Vui lòng chọn khung ca' }]}
        >
          <AppSelect options={slotOptions} />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <AppTextField placeholder="Ví dụ: đổi ca với Minh" />
        </Form.Item>

        <div className="modal-actions">
          {editing && onDelete && !readOnly ? (
            <Popconfirm
              title="Xóa ca"
              description="Ca này sẽ bị gỡ khỏi lịch làm việc."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={onDelete}
            >
              <AppButton danger icon={<DeleteOutlined />} loading={deleting} className="mr-auto">
                Xóa ca
              </AppButton>
            </Popconfirm>
          ) : null}
          {/* Form `disabled` lan xuống mọi component Antd bên trong, kể cả nút — nút
              đóng phải tự bật lại thì người xem mới thoát được modal bằng nó. */}
          <AppButton disabled={false} onClick={onCancel}>
            {readOnly ? 'Đóng' : 'Hủy'}
          </AppButton>
          {readOnly ? null : (
            <AppButton type="primary" htmlType="submit" loading={submitting}>
              Lưu
            </AppButton>
          )}
        </div>
      </Form>
    </AppModal>
  );
}
