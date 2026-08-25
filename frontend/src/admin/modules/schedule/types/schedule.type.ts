export type ShiftSlot = 'full' | 'early' | 'late';

export type StaffPosition = 'barista' | 'dealer';

export type DayType = 'weekday' | 'weekend';

export type SchedulableStaff = {
  id: number;
  name: string;
  position: StaffPosition | null;
  positionLabel: string | null;
};

export type ShiftAssignment = {
  id: number;
  workDate: string;
  slot: ShiftSlot;
  role: StaffPosition;
  roleLabel: string;
  /** Định dạng `YYYY-MM-DD HH:mm`, backend tính sẵn theo giờ mở ca của ngày đó. */
  startAt: string;
  endAt: string;
  note: string | null;
  /** Lương tháng chứa ca này đã chuyển khoản: chỉ được xem, không sửa/xóa. */
  locked: boolean;
  staff: SchedulableStaff;
};

export type ShiftSetting = {
  dayType: DayType;
  dayTypeLabel: string;
  startTime: string;
  endTime: string;
  maxBarista: number;
  maxDealer: number;
};

export type SchedulePayload = {
  assignments: ShiftAssignment[];
  settings: ShiftSetting[];
};

export type ScheduleRange = {
  from: string;
  to: string;
};

export type ShiftAssignmentFormValues = {
  staffId: number;
  workDate: string;
  slot: ShiftSlot;
  role?: StaffPosition | null;
  note?: string | null;
};
