import { Button, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import type { TournamentFormValues, TournamentRow } from '@/modules/tournament/types/tournament.type';

type TournamentFormModalProps = {
  open: boolean;
  initialValues?: TournamentRow;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: TournamentFormValues) => Promise<void> | void;
};

export function TournamentFormModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: TournamentFormModalProps) {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      title={initialValues ? 'Edit Tournament' : 'Create Tournament'}
      onCancel={onCancel}
      destroyOnClose
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          initialValues
            ? {
                ...initialValues,
                startAt: dayjs(initialValues.startAt),
              }
            : {
                status: 'draft',
                buyIn: 0,
                capacity: 9,
              }
        }
        onFinish={(values) =>
          onSubmit({
            name: values.name,
            buyIn: values.buyIn,
            capacity: values.capacity,
            status: values.status,
            startAt: values.startAt.format('YYYY-MM-DD HH:mm'),
          })
        }
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="Friday Deep Stack" />
        </Form.Item>

        <Form.Item
          name="buyIn"
          label="Buy-in"
          rules={[{ required: true, message: 'Buy-in is required' }]}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>

        <Form.Item
          name="capacity"
          label="Capacity"
          rules={[{ required: true, message: 'Capacity is required' }]}
        >
          <InputNumber className="w-full" min={2} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Status is required' }]}
        >
          <Select
            options={[
              { label: 'Draft', value: 'draft' },
              { label: 'Published', value: 'published' },
              { label: 'Running', value: 'running' },
              { label: 'Completed', value: 'completed' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="startAt"
          label="Start At"
          rules={[{ required: true, message: 'Start time is required' }]}
        >
          <DatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm" />
        </Form.Item>

        <div className="modal-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
