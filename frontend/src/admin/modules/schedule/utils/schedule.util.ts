import dayjs, { type Dayjs } from 'dayjs';
import type {
  DayType,
  ShiftAssignment,
  ShiftSetting,
  ShiftSlot,
  StaffPosition,
} from '@/admin/modules/schedule/types/schedule.type';

/** Full-time là trọn giờ mở cửa, Part-time ca 1/ca 2 là hai nửa — cách quán gọi khi xếp lịch. */
export const SLOT_LABELS: Record<ShiftSlot, string> = {
  full: 'Full-time',
  early: 'Part-time ca 1',
  late: 'Part-time ca 2',
};

/**
 * Hai màu tách biệt hẳn về sắc độ để nhìn lướt là biết ai pha chế, ai dealer —
 * kể cả khi in lịch trắng đen thì độ đậm cũng khác nhau.
 */
export const POSITION_COLORS: Record<StaffPosition, { border: string; background: string }> = {
  barista: { border: '#0f766e', background: '#14b8a6' },
  dealer: { border: '#b45309', background: '#f59e0b' },
};

/** Ca đã chốt lương chuyển hết về xám: màu vị trí không còn ý nghĩa khi không sửa được nữa. */
export const LOCKED_COLORS = { border: '#9ca3af', background: '#b6b3ab' };

export function dayTypeOf(date: Dayjs | string): DayType {
  const day = dayjs(date).day();

  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

export function settingOf(settings: ShiftSetting[], date: Dayjs | string): ShiftSetting | undefined {
  return settings.find((setting) => setting.dayType === dayTypeOf(date));
}

/**
 * Part-time ca 1/ca 2 chia đôi đúng giờ mở ca, nên chỉ cần điểm giữa — không cần cấu
 * hình riêng từng khung giờ.
 */
export function slotRange(
  setting: ShiftSetting,
  date: Dayjs | string,
  slot: ShiftSlot,
): { start: Dayjs; end: Dayjs } {
  const base = dayjs(date).startOf('day');
  const [openHour, openMinute] = setting.startTime.split(':').map(Number);
  const [closeHour, closeMinute] = setting.endTime.split(':').map(Number);
  const opensAt = base.hour(openHour).minute(openMinute);
  const closesAt = base.hour(closeHour).minute(closeMinute);
  const midpoint = opensAt.add(Math.round(closesAt.diff(opensAt, 'minute') / 2), 'minute');

  if (slot === 'early') return { start: opensAt, end: midpoint };
  if (slot === 'late') return { start: midpoint, end: closesAt };

  return { start: opensAt, end: closesAt };
}

/** Slot ứng với thời điểm được thả xuống: rơi vào nửa nào của ca thì lấy nửa đó. */
export function slotAtTime(setting: ShiftSetting, date: Dayjs | string, droppedAt: Dayjs): ShiftSlot {
  const { end } = slotRange(setting, date, 'early');

  return droppedAt.isBefore(end) ? 'early' : 'late';
}

/** Khung ca chọn tự do: hôm nào bận thì một bạn thường làm Full-time vẫn nhận Part-time được. */
export const ALL_SLOTS: ShiftSlot[] = ['full', 'early', 'late'];

export const DEFAULT_SLOT: ShiftSlot = 'full';

/**
 * Số chỗ còn lại của một ca. Ca nguyên chiếm chỗ ở cả hai nửa nên đếm theo nửa
 * ca thì mới ra đúng số người có mặt cùng lúc.
 */
export function remainingSlots(
  assignments: ShiftAssignment[],
  setting: ShiftSetting,
  date: Dayjs | string,
  role: StaffPosition,
): number {
  const dateKey = dayjs(date).format('YYYY-MM-DD');
  const capacity = role === 'barista' ? setting.maxBarista : setting.maxDealer;
  const sameDay = assignments.filter(
    (assignment) => assignment.workDate === dateKey && assignment.role === role,
  );

  const busiestHalf = (['early', 'late'] as const).reduce((peak, half) => {
    const count = sameDay.filter(
      (assignment) => assignment.slot === 'full' || assignment.slot === half,
    ).length;

    return Math.max(peak, count);
  }, 0);

  return Math.max(capacity - busiestHalf, 0);
}

export function assignmentTitle(assignment: ShiftAssignment): string {
  return assignment.staff.name;
}

/** Tuần bắt đầu từ thứ Hai, không phụ thuộc locale mặc định của dayjs. */
export function weekRangeOf(anchor: Dayjs): { from: string; to: string } {
  const weekday = anchor.day();
  const monday = anchor.startOf('day').add(weekday === 0 ? -6 : 1 - weekday, 'day');

  return {
    from: monday.format('YYYY-MM-DD'),
    to: monday.add(6, 'day').format('YYYY-MM-DD'),
  };
}
