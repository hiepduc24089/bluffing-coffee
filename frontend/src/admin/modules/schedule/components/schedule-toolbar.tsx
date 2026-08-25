import { LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Segmented, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import AppButton from '@/shared/components/atoms/AppButton';

type ScheduleToolbarProps = {
  weekStart: string;
  weekEnd: string;
  view: 'calendar' | 'list';
  canEdit: boolean;
  onChangeWeek: (offsetWeeks: number) => void;
  onToday: () => void;
  onChangeView: (view: 'calendar' | 'list') => void;
  onCreate: () => void;
};

export function ScheduleToolbar({
  weekStart,
  weekEnd,
  view,
  canEdit,
  onChangeWeek,
  onToday,
  onChangeView,
  onCreate,
}: ScheduleToolbarProps) {
  return (
    <div className="schedule-toolbar">
      <Space wrap>
        <AppButton icon={<LeftOutlined />} onClick={() => onChangeWeek(-1)} aria-label="Tuần trước" />
        <AppButton onClick={onToday}>Tuần này</AppButton>
        <AppButton icon={<RightOutlined />} onClick={() => onChangeWeek(1)} aria-label="Tuần sau" />
        <Typography.Text strong>
          {dayjs(weekStart).format('DD/MM')} – {dayjs(weekEnd).format('DD/MM/YYYY')}
        </Typography.Text>
      </Space>

      <Space wrap>
        <Segmented
          value={view}
          onChange={(value) => onChangeView(value as 'calendar' | 'list')}
          options={[
            { label: 'Lịch', value: 'calendar' },
            { label: 'Danh sách', value: 'list' },
          ]}
        />
        {canEdit ? (
          <AppButton type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Thêm ca
          </AppButton>
        ) : null}
      </Space>
    </div>
  );
}
