import { http } from '@/shared/lib/http';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type { PayrollRow } from '@/admin/modules/payroll/types/payroll.type';

export const payrollQueryKeys = {
  all: ['payroll'] as const,
  month: (month: string) => [...payrollQueryKeys.all, month] as const,
};

export async function getPayroll(month: string): Promise<PayrollRow[]> {
  const response = await http.get<{ data: PayrollRow[] }>('/admin/payroll', {
    headers: getAdminAuthHeaders(),
    params: { month },
  });

  return response.data.data;
}

export async function updateHourlyRate(staffId: number, hourlyRate: number | null): Promise<void> {
  await http.put(
    `/admin/payroll/staff/${staffId}/rate`,
    { hourlyRate },
    { headers: getAdminAuthHeaders() },
  );
}

export async function payPayroll(staffId: number, month: string): Promise<void> {
  await http.post(
    `/admin/payroll/staff/${staffId}/payment`,
    { month },
    { headers: getAdminAuthHeaders() },
  );
}

export async function revertPayrollPayment(staffId: number, month: string): Promise<void> {
  await http.delete(`/admin/payroll/staff/${staffId}/payment`, {
    headers: getAdminAuthHeaders(),
    params: { month },
  });
}
