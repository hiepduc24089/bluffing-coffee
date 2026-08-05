import { useMemo, useState } from 'react';
import { Col, Divider, Form, Row } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppCheckbox from '@/shared/components/atoms/AppCheckbox';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTextArea from '@/shared/components/atoms/AppTextArea';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { GameFormatLevelEditor } from '@/admin/modules/game-format/components/game-format-level-editor';
import type {
  GameFormatFormValues,
  GameFormatRow,
} from '@/admin/modules/game-format/types/game-format.type';
import {
  tournamentTypeOptions,
  withDerivedLevelNumbers,
} from '@/admin/modules/game-format/utils/game-format.util';
import {
  stableSerialize,
  useUnsavedChangesGuard,
} from '@/shared/hooks/use-unsaved-changes-guard';

const defaultFormValues: GameFormatFormValues = {
  name: '',
  code: '',
  tournamentType: 'normal',
  startingStack: 20000,
  lateRegUntilLevel: null,
  maxRebuy: null,
  rebuyStack: null,
  description: null,
  isActive: true,
  levels: [
    { smallBlind: 100, bigBlind: 200, ante: 0, durationMinutes: 15, isBreak: false, note: null },
  ],
};

type GameFormatFormModalProps = {
  open: boolean;
  initialValues?: GameFormatRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: GameFormatFormValues) => Promise<void> | void;
};

export function GameFormatFormModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: GameFormatFormModalProps) {
  const [form] = Form.useForm<GameFormatFormValues>();
  const watchedValues = Form.useWatch([], form);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  const currentSnapshot = useMemo(
    () => stableSerialize(normalizeGameFormatFormValues(form.getFieldsValue(true))),
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
      title={initialValues ? 'Chỉnh sửa chế độ chơi' : 'Thêm chế độ chơi'}
      onClose={() => confirmUnsavedChanges(onCancel)}
      footer={null}
      maxWidth="max-w-5xl"
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          const nextValues = toFormValues(initialValues);

          form.setFieldsValue(nextValues);
          setInitialSnapshot(stableSerialize(normalizeGameFormatFormValues(nextValues)));
        } else {
          form.resetFields();
          setInitialSnapshot('');
        }
      }}
    >
      <Form<GameFormatFormValues>
        form={form}
        layout="vertical"
        initialValues={defaultFormValues}
        onFinish={(values) =>
          onSubmit({
            ...values,
            isActive: Boolean(values.isActive),
            startingStack: Number(values.startingStack),
            lateRegUntilLevel: values.lateRegUntilLevel ?? null,
            maxRebuy: values.maxRebuy ?? null,
            rebuyStack: values.rebuyStack ?? null,
            description: values.description || null,
            levels: withDerivedLevelNumbers(values.levels ?? []).map((level) => ({
              ...level,
              smallBlind: Number(level.smallBlind ?? 0),
              bigBlind: Number(level.bigBlind ?? 0),
              ante: Number(level.ante ?? 0),
              durationMinutes: Number(level.durationMinutes),
              isBreak: Boolean(level.isBreak),
              note: level.note || null,
            })),
          })
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label="Tên chế độ chơi"
              rules={[{ required: true, message: 'Vui lòng nhập tên chế độ chơi' }]}
            >
              <AppTextField placeholder="DeepStack Classic" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="code"
              label="Mã chế độ chơi"
              rules={[{ required: true, message: 'Vui lòng nhập mã chế độ chơi' }]}
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
          <Col xs={24}>
            <Form.Item name="isActive" valuePropName="checked">
              <AppCheckbox>Đang sử dụng</AppCheckbox>
            </Form.Item>
          </Col>
        </Row>

        <Divider className="!my-2" />

        <GameFormatLevelEditor form={form} />

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

function toFormValues(gameFormat?: GameFormatRow | null): GameFormatFormValues {
  if (!gameFormat) return defaultFormValues;

  return {
    name: gameFormat.name,
    code: gameFormat.code,
    tournamentType: gameFormat.tournamentType,
    startingStack: gameFormat.startingStack,
    lateRegUntilLevel: gameFormat.lateRegUntilLevel ?? null,
    maxRebuy: gameFormat.maxRebuy ?? null,
    rebuyStack: gameFormat.rebuyStack ?? null,
    description: gameFormat.description ?? null,
    isActive: gameFormat.isActive,
    levels: gameFormat.levels.map((level) => ({
      levelNumber: level.levelNumber,
      smallBlind: level.smallBlind,
      bigBlind: level.bigBlind,
      ante: level.ante,
      durationMinutes: level.durationMinutes,
      isBreak: level.isBreak,
      note: level.note ?? null,
    })),
  };
}

function normalizeGameFormatFormValues(values: Partial<GameFormatFormValues>) {
  return {
    name: values.name ?? '',
    code: values.code ?? '',
    tournamentType: values.tournamentType ?? 'normal',
    startingStack: Number(values.startingStack ?? 0),
    lateRegUntilLevel: values.lateRegUntilLevel ?? null,
    maxRebuy: values.maxRebuy ?? null,
    rebuyStack: values.rebuyStack ?? null,
    description: values.description || null,
    isActive: Boolean(values.isActive),
    levels: (values.levels ?? []).map((level) => ({
      smallBlind: Number(level?.smallBlind ?? 0),
      bigBlind: Number(level?.bigBlind ?? 0),
      ante: Number(level?.ante ?? 0),
      durationMinutes: Number(level?.durationMinutes ?? 0),
      isBreak: Boolean(level?.isBreak),
      note: level?.note || null,
    })),
  };
}
