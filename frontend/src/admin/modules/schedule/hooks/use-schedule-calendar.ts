import { useQuery } from '@tanstack/react-query';
import {
  getSchedulableStaff,
  getSchedule,
  scheduleQueryKeys,
} from '@/admin/modules/schedule/api/schedule.api';
import type { ScheduleRange } from '@/admin/modules/schedule/types/schedule.type';

export function useScheduleCalendar(range: ScheduleRange) {
  return useQuery({
    queryKey: scheduleQueryKeys.calendar(range),
    queryFn: () => getSchedule(range),
  });
}

export function useSchedulableStaff() {
  return useQuery({
    queryKey: scheduleQueryKeys.staff,
    queryFn: getSchedulableStaff,
  });
}
