import { http } from '@/shared/lib/http';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  SchedulableStaff,
  SchedulePayload,
  ScheduleRange,
  ShiftAssignment,
  ShiftAssignmentFormValues,
} from '@/admin/modules/schedule/types/schedule.type';

export const scheduleQueryKeys = {
  all: ['schedule'] as const,
  calendar: (range: ScheduleRange) => [...scheduleQueryKeys.all, 'calendar', range] as const,
  staff: ['schedule', 'staff'] as const,
};

export async function getSchedule(range: ScheduleRange): Promise<SchedulePayload> {
  const response = await http.get<{ data: SchedulePayload }>('/admin/schedule', {
    headers: getAdminAuthHeaders(),
    params: { from: range.from, to: range.to },
  });

  return response.data.data;
}

export async function getSchedulableStaff(): Promise<SchedulableStaff[]> {
  const response = await http.get<{ data: SchedulableStaff[] }>('/admin/schedule/staff', {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function createAssignment(
  payload: ShiftAssignmentFormValues,
): Promise<ShiftAssignment> {
  const response = await http.post<{ data: ShiftAssignment }>(
    '/admin/schedule/assignments',
    payload,
    { headers: getAdminAuthHeaders() },
  );

  return response.data.data;
}

export async function updateAssignment(
  id: number,
  payload: ShiftAssignmentFormValues,
): Promise<ShiftAssignment> {
  const response = await http.put<{ data: ShiftAssignment }>(
    `/admin/schedule/assignments/${id}`,
    payload,
    { headers: getAdminAuthHeaders() },
  );

  return response.data.data;
}

export async function deleteAssignment(id: number): Promise<void> {
  await http.delete(`/admin/schedule/assignments/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}
