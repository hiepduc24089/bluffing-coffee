import type { SchedulableStaff, ShiftSlot } from '@/admin/modules/schedule/types/schedule.type';

export type PayrollShift = {
  workDate: string;
  slot: ShiftSlot;
  slotLabel: string;
  startAt: string;
  endAt: string;
  hours: number;
};

/** Ảnh chụp lúc chuyển khoản — bảng lương tính lại từ lịch, số đã trả thì không đổi. */
export type PayrollPayment = {
  paidAt: string;
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
};

export type PayrollRow = {
  staff: SchedulableStaff;
  shiftCount: number;
  fullShiftCount: number;
  halfShiftCount: number;
  totalHours: number;
  /** Chưa chốt lương thì để null, khi đó thành tiền cũng null. */
  hourlyRate: number | null;
  totalPay: number | null;
  shifts: PayrollShift[];
  isPaid: boolean;
  /** Đã chốt lương giờ, có ca trong tháng và chưa trả lần nào. */
  isPayable: boolean;
  payment: PayrollPayment | null;
};
