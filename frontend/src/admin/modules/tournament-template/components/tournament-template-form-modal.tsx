import { useMemo, useState } from 'react';
import { Col, Divider, Form, Row, Space, Typography } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTextArea from '@/shared/components/atoms/AppTextArea';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { TournamentTemplateLevelEditor } from '@/admin/modules/tournament-template/components/tournament-template-level-editor';
import type {
  TournamentTemplateFormValues,
  TournamentTemplateRow,
} from '@/admin/modules/tournament-template/types/tournament-template.type';
import {
  tournamentTypeOptions,
  withDerivedLevelNumbers,
} from '@/admin/modules/tournament-template/utils/tournament-template.util';
import {
  stableSerialize,
  useUnsavedChangesGuard,
} from '@/shared/hooks/use-unsaved-changes-guard';

const defaultFormValues: TournamentTemplateFormValues = {
  name: '',
  code: '',
  tournamentType: 'normal',
  startingStack: 20000,
  lateRegUntilLevel: null,
  maxRebuy: null,
  rebuyStack: null,
  description: null,
  defaultPriceWithDrink: 0,
  defaultPriceWithoutDrink: 0,
  levels: [
    { smallBlind: 100, bigBlind: 200, ante: 0, durationMinutes: 15, isBreak: false, note: null },
  ],
  rewards: [
    { position: 1, bpReward: 0 },
    { position: 2, bpReward: 0 },
    { position: 3, bpReward: 0 },
  ],
};

type TournamentTemplateFormModalProps = {
  open: boolean;
  initialValues?: TournamentTemplateRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: TournamentTemplateFormValues) => Promise<void> | void;
};

export function TournamentTemplateFormModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: TournamentTemplateFormModalProps) {
  const [form] = Form.useForm<TournamentTemplateFormValues>();
  const watchedValues = Form.useWatch([], form);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  const currentSnapshot = useMemo(
    () => stableSerialize(normalizeTournamentTemplateFormValues(form.getFieldsValue(true))),
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
      title={initialValues ? 'Chỉnh sửa mẫu giải đấu' : 'Thêm mẫu giải đấu'}
      onClose={() => confirmUnsavedChanges(onCancel)}
      footer={null}
      maxWidth="max-w-5xl"
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          const nextValues = toFormValues(initialValues);

          form.setFieldsValue(nextValues);
          setInitialSnapshot(stableSerialize(normalizeTournamentTemplateFormValues(nextValues)));
        } else {
          form.resetFields();
          setInitialSnapshot('');
        }
      }}
    >
      <Form<TournamentTemplateFormValues>
        form={form}
        layout="vertical"
        initialValues={defaultFormValues}
        onFinish={(values) =>
          onSubmit({
            ...values,
            startingStack: Number(values.startingStack),
            lateRegUntilLevel: values.lateRegUntilLevel ?? null,
            maxRebuy: values.maxRebuy ?? null,
            rebuyStack: values.rebuyStack ?? null,
            description: values.description || null,
            defaultPriceWithDrink: Number(values.defaultPriceWithDrink ?? 0),
            defaultPriceWithoutDrink: Number(values.defaultPriceWithoutDrink ?? 0),
            levels: withDerivedLevelNumbers(values.levels ?? []).map((level) => ({
              ...level,
              smallBlind: Number(level.smallBlind ?? 0),
              bigBlind: Number(level.bigBlind ?? 0),
              ante: Number(level.ante ?? 0),
              durationMinutes: Number(level.durationMinutes),
              isBreak: Boolean(level.isBreak),
              note: level.note || null,
            })),
            rewards: (values.rewards ?? []).map((reward) => ({
              position: Number(reward.position),
              bpReward: Number(reward.bpReward ?? 0),
            })),
          })
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label="Tên mẫu giải đấu"
              rules={[{ required: true, message: 'Vui lòng nhập tên mẫu giải đấu' }]}
            >
              <AppTextField placeholder="DeepStack Classic" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="code"
              label="Mã mẫu giải đấu"
              rules={[{ required: true, message: 'Vui lòng nhập mã mẫu giải đấu' }]}
            >
              <AppTextField placeholder="DEEPSTACK_CLASSIC" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="tournamentType"
              label="Nhóm giải"
              extra="Dùng để tính thống kê và huy hiệu theo loại giải."
              rules={[{ required: true, message: 'Vui lòng chọn nhóm giải' }]}
            >
              <AppSelect options={tournamentTypeOptions} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="startingStack"
              label="Stack khởi điểm"
              rules={[{ required: true, message: 'Vui lòng nhập stack khởi điểm' }]}
            >
              <AppInputNumber className="w-full" min={1} precision={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="lateRegUntilLevel"
              label="Late reg / Rebuy đến hết level"
              extra="Bỏ trống nếu không giới hạn."
            >
              <AppInputNumber className="w-full" min={1} precision={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="maxRebuy" label="Số lần rebuy tối đa" extra="Bỏ trống nếu không giới hạn.">
              <AppInputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="rebuyStack" label="Stack nhận khi rebuy">
              <AppInputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="description" label="Mô tả">
              <AppTextArea rows={2} placeholder="Ghi chú thể lệ, phần thưởng, lưu ý vận hành" />
            </Form.Item>
          </Col>
        </Row>

        <Divider className="!my-2" orientation="left">
          Giá vé mặc định
        </Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="defaultPriceWithDrink"
              label="Vé + 1 đồ uống pha + nước lọc"
              rules={[{ required: true, message: 'Vui lòng nhập giá vé có đồ uống pha' }]}
            >
              <AppInputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="defaultPriceWithoutDrink"
              label="Vé + nước lọc"
              rules={[{ required: true, message: 'Vui lòng nhập giá vé nước lọc' }]}
            >
              <AppInputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
          </Col>
        </Row>

        <Divider className="!my-2" orientation="left">
          BP thưởng theo thứ hạng
        </Divider>

        <Form.List name="rewards">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={4} className="w-full">
              {fields.length === 0 && (
                <Typography.Text type="secondary">
                  Chưa có hạng nào. Giải dùng mẫu này sẽ không cộng BP khi chốt thưởng.
                </Typography.Text>
              )}
              {fields.map((field) => (
                <Space key={field.key} align="baseline" size={12}>
                  <Form.Item
                    {...field}
                    name={[field.name, 'position']}
                    label="Thứ hạng"
                    rules={[{ required: true, message: 'Nhập thứ hạng' }]}
                  >
                    <AppInputNumber min={1} precision={0} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'bpReward']}
                    label="BP thưởng"
                    rules={[{ required: true, message: 'Nhập BP' }]}
                  >
                    <AppInputNumber min={0} precision={0} />
                  </Form.Item>
                  <AppButton danger onClick={() => remove(field.name)}>
                    Xóa
                  </AppButton>
                </Space>
              ))}
              <AppButton onClick={() => add({ position: fields.length + 1, bpReward: 0 })}>
                Thêm thứ hạng
              </AppButton>
            </Space>
          )}
        </Form.List>

        <Divider className="!my-2" orientation="left">
          Cấu trúc blind
        </Divider>

        <TournamentTemplateLevelEditor form={form} />

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

function toFormValues(template?: TournamentTemplateRow | null): TournamentTemplateFormValues {
  if (!template) return defaultFormValues;

  return {
    name: template.name,
    code: template.code,
    tournamentType: template.tournamentType,
    startingStack: template.startingStack,
    lateRegUntilLevel: template.lateRegUntilLevel ?? null,
    maxRebuy: template.maxRebuy ?? null,
    rebuyStack: template.rebuyStack ?? null,
    description: template.description ?? null,
    defaultPriceWithDrink: template.defaultPriceWithDrink,
    defaultPriceWithoutDrink: template.defaultPriceWithoutDrink,
    levels: template.levels.map((level) => ({
      levelNumber: level.levelNumber,
      smallBlind: level.smallBlind,
      bigBlind: level.bigBlind,
      ante: level.ante,
      durationMinutes: level.durationMinutes,
      isBreak: level.isBreak,
      note: level.note ?? null,
    })),
    rewards: template.rewards
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((reward) => ({
        position: reward.position,
        bpReward: reward.bpReward,
      })),
  };
}

function normalizeTournamentTemplateFormValues(values: Partial<TournamentTemplateFormValues>) {
  return {
    name: values.name ?? '',
    code: values.code ?? '',
    tournamentType: values.tournamentType ?? 'normal',
    startingStack: Number(values.startingStack ?? 0),
    lateRegUntilLevel: values.lateRegUntilLevel ?? null,
    maxRebuy: values.maxRebuy ?? null,
    rebuyStack: values.rebuyStack ?? null,
    description: values.description || null,
    defaultPriceWithDrink: Number(values.defaultPriceWithDrink ?? 0),
    defaultPriceWithoutDrink: Number(values.defaultPriceWithoutDrink ?? 0),
    levels: (values.levels ?? []).map((level) => ({
      smallBlind: Number(level?.smallBlind ?? 0),
      bigBlind: Number(level?.bigBlind ?? 0),
      ante: Number(level?.ante ?? 0),
      durationMinutes: Number(level?.durationMinutes ?? 0),
      isBreak: Boolean(level?.isBreak),
      note: level?.note || null,
    })),
    rewards: (values.rewards ?? []).map((reward) => ({
      position: Number(reward?.position ?? 0),
      bpReward: Number(reward?.bpReward ?? 0),
    })),
  };
}
