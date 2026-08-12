import { useEffect, useMemo, useState } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import AppButton from '@/shared/components/atoms/AppButton';
import AppDatePicker from '@/shared/components/atoms/AppDatePicker';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type { TournamentTemplateRow } from '@/admin/modules/tournament-template/types/tournament-template.type';
import {
  formatChips,
  formatDuration,
} from '@/admin/modules/tournament-template/utils/tournament-template.util';
import type {
  TournamentFormValues,
  TournamentRow,
} from '@/admin/modules/tournament/types/tournament.type';
import {
  stableSerialize,
  useUnsavedChangesGuard,
} from '@/shared/hooks/use-unsaved-changes-guard';

type TournamentFormModalProps = {
  open: boolean;
  initialValues?: TournamentRow;
  submitting?: boolean;
  tournamentTemplates?: TournamentTemplateRow[];
  onCancel: () => void;
  onSubmit: (values: TournamentFormValues) => Promise<void> | void;
};

export function TournamentFormModal({
  open,
  initialValues,
  submitting,
  tournamentTemplates = [],
  onCancel,
  onSubmit,
}: TournamentFormModalProps) {
  const [form] = Form.useForm();
  const watchedValues = Form.useWatch([], form);
  const selectedTemplateId = Form.useWatch('tournamentTemplateId', form);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const selectedTemplate = tournamentTemplates.find(
    (template) => template.id === selectedTemplateId,
  );

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      const nextValues = {
        ...initialValues,
        startAt: dayjs(initialValues.startAt),
      };

      form.setFieldsValue(nextValues);
      setInitialSnapshot(stableSerialize(normalizeTournamentFormValues(nextValues)));
      return;
    }

    const nextValues = {
      tournamentTemplateId: null,
      buyIn: 0,
      ticketPriceWithDrink: 0,
      ticketPriceWithoutDrink: 0,
      capacity: 9,
    };

    form.setFieldsValue(nextValues);
    setInitialSnapshot(stableSerialize(normalizeTournamentFormValues(nextValues)));
  }, [form, initialValues, open]);

  const currentSnapshot = useMemo(
    () => stableSerialize(normalizeTournamentFormValues(form.getFieldsValue(true))),
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
      title={initialValues ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu'}
      onClose={() => confirmUnsavedChanges(onCancel)}
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
                tournamentTemplateId: null,
                buyIn: 0,
                ticketPriceWithDrink: 0,
                ticketPriceWithoutDrink: 0,
                capacity: 9,
              }
        }
        onFinish={(values) =>
          onSubmit({
            name: values.name,
            tournamentTemplateId: values.tournamentTemplateId ?? null,
            buyIn: values.buyIn,
            ticketPriceWithDrink: values.ticketPriceWithDrink,
            ticketPriceWithoutDrink: values.ticketPriceWithoutDrink,
            capacity: values.capacity,
            startAt: values.startAt.format('YYYY-MM-DD HH:mm'),
          })
        }
      >
        <Form.Item name="name" label="Tên giải đấu" rules={[{ required: true, message: 'Vui lòng nhập tên giải đấu' }]}>
          <AppTextField placeholder="Giải tối thứ sáu" />
        </Form.Item>

        <Form.Item
          name="tournamentTemplateId"
          label="Mẫu giải đấu"
          extra={selectedTemplate ? describeTemplate(selectedTemplate) : undefined}
        >
          <AppSelect
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn mẫu giải đấu áp dụng"
            options={tournamentTemplates.map((template) => ({
              label: `${template.name} (${template.code})`,
              value: template.id,
            }))}
            onChange={(value) => {
              const template = tournamentTemplates.find((item) => item.id === value);

              if (!template) return;

              form.setFieldsValue({
                ticketPriceWithDrink: template.defaultPriceWithDrink,
                ticketPriceWithoutDrink: template.defaultPriceWithoutDrink,
              });
            }}
          />
        </Form.Item>

        <Form.Item
          name="buyIn"
          hidden
        >
          <AppInputNumber className="w-full" min={0} />
        </Form.Item>

        <Form.Item
          name="ticketPriceWithDrink"
          label="Giá vé + 1 đồ uống pha + nước lọc"
          rules={[{ required: true, message: 'Vui lòng nhập giá vé có đồ uống pha' }]}
        >
          <AppInputNumber className="w-full" min={0} precision={0} />
        </Form.Item>

        <Form.Item
          name="ticketPriceWithoutDrink"
          label="Giá vé + nước lọc"
          rules={[{ required: true, message: 'Vui lòng nhập giá vé không đồ uống pha' }]}
        >
          <AppInputNumber className="w-full" min={0} precision={0} />
        </Form.Item>

        <Form.Item
          name="capacity"
          label="Sức chứa"
          rules={[{ required: true, message: 'Vui lòng nhập sức chứa' }]}
        >
          <AppInputNumber className="w-full" min={2} />
        </Form.Item>

        <Form.Item
          name="startAt"
          label="Thời gian bắt đầu"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
        >
          <AppDatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm" />
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

function describeTemplate(template: TournamentTemplateRow) {
  const lateReg = template.lateRegUntilLevel
    ? `late reg đến hết level ${template.lateRegUntilLevel}`
    : 'late reg không giới hạn';

  const rewards = template.rewards.length
    ? template.rewards
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((reward) => `#${reward.position} ${reward.bpReward} BP`)
        .join(' · ')
    : 'chưa cấu hình BP thưởng';

  return `Stack ${formatChips(template.startingStack)} · ${template.levelCount} level · ${lateReg} · ước tính ${formatDuration(template.totalDurationMinutes)} — ${rewards}`;
}

function normalizeTournamentFormValues(values: Record<string, unknown>) {
  return {
    name: values.name ?? '',
    tournamentTemplateId: values.tournamentTemplateId ?? null,
    buyIn: Number(values.buyIn ?? 0),
    ticketPriceWithDrink: Number(values.ticketPriceWithDrink ?? 0),
    ticketPriceWithoutDrink: Number(values.ticketPriceWithoutDrink ?? 0),
    capacity: Number(values.capacity ?? 9),
    startAt: values.startAt ?? null,
  };
}
