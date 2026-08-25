import { Card, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  POSITION_COLORS,
  remainingSlots,
  settingOf,
} from '@/admin/modules/schedule/utils/schedule.util';
import type { ShiftAssignment, ShiftSetting } from '@/admin/modules/schedule/types/schedule.type';

type ScheduleLegendProps = {
  weekStart: string;
  assignments: ShiftAssignment[];
  settings: ShiftSetting[];
};

/**
 * Nhìn màu thì biết vị trí, nhưng "còn thiếu mấy người" mới là thứ người xếp ca
 * cần, nên liệt kê luôn số chỗ trống từng ngày.
 */
export function ScheduleLegend({ weekStart, assignments, settings }: ScheduleLegendProps) {
  const days = Array.from({ length: 7 }, (_, index) => dayjs(weekStart).add(index, 'day'));

  return (
    <Card title="Chú thích & chỗ trống" size="small" className="schedule-legend">
      <div className="schedule-legend__keys">
        <span className="schedule-legend__key">
          <i style={{ backgroundColor: POSITION_COLORS.barista.background }} /> Pha chế
        </span>
        <span className="schedule-legend__key">
          <i style={{ backgroundColor: POSITION_COLORS.dealer.background }} /> Dealer
        </span>
      </div>

      <div className="schedule-legend__days">
        {days.map((day) => {
          const setting = settingOf(settings, day);

          if (!setting) return null;

          const barista = remainingSlots(assignments, setting, day, 'barista');
          const dealer = remainingSlots(assignments, setting, day, 'dealer');
          const isFull = barista === 0 && dealer === 0;

          return (
            <div key={day.format('YYYY-MM-DD')} className="schedule-legend__day">
              <Typography.Text strong>{day.format('dd DD/MM')}</Typography.Text>
              <Typography.Text type={isFull ? 'success' : 'warning'}>
                {isFull
                  ? 'Đủ người'
                  : `Thiếu ${barista} pha chế · ${dealer} dealer`}
              </Typography.Text>
              <Typography.Text type="secondary">
                {setting.startTime}–{setting.endTime}
              </Typography.Text>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
