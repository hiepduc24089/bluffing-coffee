import { Form } from 'antd';
import dayjs from 'dayjs';
import AppButton from '@/shared/components/atoms/AppButton';
import AppDatePicker from '@/shared/components/atoms/AppDatePicker';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type {
  RewardProfile,
  TournamentFormValues,
  TournamentRow,
} from '@/admin/modules/tournament/types/tournament.type';

type TournamentFormModalProps = {
  open: boolean;
  initialValues?: TournamentRow;
  submitting?: boolean;
  rewardProfiles?: RewardProfile[];
  onCancel: () => void;
  onSubmit: (values: TournamentFormValues) => Promise<void> | void;
};

export function TournamentFormModal({
  open,
  initialValues,
  submitting,
  rewardProfiles = [],
  onCancel,
  onSubmit,
}: TournamentFormModalProps) {
  const [form] = Form.useForm();

  return (
    <AppModal
      isOpen={open}
      title={initialValues ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu'}
      onClose={onCancel}
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
            rewardProfileId: values.rewardProfileId ?? null,
            startAt: values.startAt.format('YYYY-MM-DD HH:mm'),
          })
        }
      >
        <Form.Item name="name" label="Tên giải đấu" rules={[{ required: true, message: 'Vui lòng nhập tên giải đấu' }]}>
          <AppTextField placeholder="Giải tối thứ sáu" />
        </Form.Item>

        <Form.Item name="rewardProfileId" label="Reward profile">
          <AppSelect
            allowClear
            options={rewardProfiles.map((profile) => ({
              label: `${profile.name} (${profile.code})`,
              value: profile.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="buyIn"
          label="Phí tham gia"
          rules={[{ required: true, message: 'Vui lòng nhập phí tham gia' }]}
        >
          <AppInputNumber className="w-full" min={0} />
        </Form.Item>

        <Form.Item
          name="capacity"
          label="Sức chứa"
          rules={[{ required: true, message: 'Vui lòng nhập sức chứa' }]}
        >
          <AppInputNumber className="w-full" min={2} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <AppSelect
            options={[
              { label: 'Bản nháp', value: 'draft' },
              { label: 'Đã công bố', value: 'published' },
              { label: 'Đang diễn ra', value: 'running' },
              { label: 'Đã hoàn tất', value: 'completed' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="startAt"
          label="Thời gian bắt đầu"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
        >
          <AppDatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm" />
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
