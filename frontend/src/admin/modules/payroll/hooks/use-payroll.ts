import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPayroll,
  payPayroll,
  payrollQueryKeys,
  revertPayrollPayment,
  updateHourlyRate,
} from '@/admin/modules/payroll/api/payroll.api';
import { scheduleQueryKeys } from '@/admin/modules/schedule/api/schedule.api';

export function usePayroll(month: string) {
  return useQuery({
    queryKey: payrollQueryKeys.month(month),
    queryFn: () => getPayroll(month),
  });
}

export function useUpdateHourlyRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, hourlyRate }: { staffId: number; hourlyRate: number | null }) =>
      updateHourlyRate(staffId, hourlyRate),
    onSettled: () => queryClient.invalidateQueries({ queryKey: payrollQueryKeys.all }),
  });
}

/**
 * Thanh toán khóa luôn các ca của tháng nên phải nạp lại cả lịch làm việc, không
 * chỉ bảng lương — nếu không thì lịch đang mở vẫn cho kéo thả những ca đã khóa.
 */
export function usePayrollPaymentMutations(month: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: payrollQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all });
  };

  const pay = useMutation({
    mutationFn: (staffId: number) => payPayroll(staffId, month),
    onSettled: invalidate,
  });

  const revert = useMutation({
    mutationFn: (staffId: number) => revertPayrollPayment(staffId, month),
    onSettled: invalidate,
  });

  return { pay, revert };
}
