import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CoffeeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Form, Space, Tag, Tooltip, Typography } from 'antd';
import type { FormInstance } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';
import AppCheckbox from '@/shared/components/atoms/AppCheckbox';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type {
  TournamentTemplateFormValues,
  TournamentTemplateLevelFormValues,
} from '@/admin/modules/tournament-template/types/tournament-template.type';
import { formatDuration, sumLevelDuration } from '@/admin/modules/tournament-template/utils/tournament-template.util';

const GRID_TEMPLATE =
  'grid grid-cols-[40px_72px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_84px_minmax(140px,1.4fr)_104px] gap-2 items-start';

const defaultLevel: TournamentTemplateLevelFormValues = {
  smallBlind: 100,
  bigBlind: 200,
  ante: 0,
  durationMinutes: 15,
  isBreak: false,
  note: null,
};

type TournamentTemplateLevelEditorProps = {
  form: FormInstance<TournamentTemplateFormValues>;
};

export function TournamentTemplateLevelEditor({ form }: TournamentTemplateLevelEditorProps) {
  const levels = (Form.useWatch('levels', form) ?? []) as TournamentTemplateLevelFormValues[];
  const totalDuration = sumLevelDuration(levels);

  const buildNextLevel = (): TournamentTemplateLevelFormValues => {
    const lastLevel = [...levels].reverse().find((level) => level && !level.isBreak);

    if (!lastLevel) return defaultLevel;

    const bigBlind = Number(lastLevel.bigBlind ?? 0);

    return {
      smallBlind: bigBlind,
      bigBlind: bigBlind * 2,
      ante: Number(lastLevel.ante ?? 0) > 0 ? bigBlind * 2 : 0,
      durationMinutes: Number(lastLevel.durationMinutes ?? defaultLevel.durationMinutes),
      isBreak: false,
      note: null,
    };
  };

  const buildBreak = (): TournamentTemplateLevelFormValues => ({
    smallBlind: 0,
    bigBlind: 0,
    ante: 0,
    durationMinutes: 15,
    isBreak: true,
    note: 'Nghỉ giải lao',
  });

  return (
    <Form.List name="levels">
      {(fields, { add, remove, move }) => {
        let blindLevelNumber = 0;

        return (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Typography.Text strong>Cấu trúc blind</Typography.Text>
              <Space size={8} wrap>
                <Tag color="blue">{fields.length} dòng</Tag>
                <Tag color="green">Tổng thời gian: {formatDuration(totalDuration)}</Tag>
              </Space>
            </div>

            {fields.length ? (
              <div className={`${GRID_TEMPLATE} text-xs font-medium text-slate-500`}>
                <span>#</span>
                <span>Level</span>
                <span>Small blind</span>
                <span>Big blind</span>
                <span>Ante</span>
                <span>Phút</span>
                <span>Ghi chú</span>
                <span>Thao tác</span>
              </div>
            ) : null}

            {fields.map((field, index) => {
              const level = levels[index];
              const isBreak = Boolean(level?.isBreak);

              if (!isBreak) blindLevelNumber += 1;

              return (
                <div key={field.key} className={GRID_TEMPLATE}>
                  <span className="pt-2 text-xs text-slate-400">{index + 1}</span>
                  <span className="pt-2">
                    {isBreak ? <Tag color="orange">Break</Tag> : <Tag>{blindLevelNumber}</Tag>}
                  </span>

                  <Form.Item
                    name={[field.name, 'smallBlind']}
                    className="!mb-0"
                    rules={
                      isBreak ? [] : [{ required: true, message: 'Nhập small blind' }]
                    }
                  >
                    <AppInputNumber className="w-full" min={0} precision={0} disabled={isBreak} />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'bigBlind']}
                    className="!mb-0"
                    rules={isBreak ? [] : [{ required: true, message: 'Nhập big blind' }]}
                  >
                    <AppInputNumber className="w-full" min={0} precision={0} disabled={isBreak} />
                  </Form.Item>

                  <Form.Item name={[field.name, 'ante']} className="!mb-0">
                    <AppInputNumber className="w-full" min={0} precision={0} disabled={isBreak} />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'durationMinutes']}
                    className="!mb-0"
                    rules={[{ required: true, message: 'Nhập số phút' }]}
                  >
                    <AppInputNumber className="w-full" min={1} max={600} precision={0} />
                  </Form.Item>

                  <Form.Item name={[field.name, 'note']} className="!mb-0">
                    <AppTextField placeholder="Ghi chú" />
                  </Form.Item>

                  <Space size={4} className="pt-1">
                    <Form.Item name={[field.name, 'isBreak']} valuePropName="checked" className="!mb-0" hidden>
                      <AppCheckbox />
                    </Form.Item>
                    <Tooltip title="Lên">
                      <AppButton
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                      />
                    </Tooltip>
                    <Tooltip title="Xuống">
                      <AppButton
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, index + 1)}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa dòng">
                      <AppButton
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              );
            })}

            <Space size={8} wrap>
              <AppButton icon={<PlusOutlined />} onClick={() => add(buildNextLevel())}>
                Thêm level
              </AppButton>
              <AppButton icon={<CoffeeOutlined />} onClick={() => add(buildBreak())}>
                Thêm break
              </AppButton>
            </Space>
          </div>
        );
      }}
    </Form.List>
  );
}
