import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAssignment,
  deleteAssignment,
  scheduleQueryKeys,
  updateAssignment,
} from '@/admin/modules/schedule/api/schedule.api';
import type { ShiftAssignmentFormValues } from '@/admin/modules/schedule/types/schedule.type';

/**
 * Mọi thao tác đều nạp lại lịch: backend có thể từ chối vì quá sức chứa hoặc
 * trùng người, nên trạng thái sau cùng phải lấy từ server chứ không đoán ở client.
 */
export function useScheduleMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all });

  const create = useMutation({
    mutationFn: createAssignment,
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ShiftAssignmentFormValues }) =>
      updateAssignment(id, values),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteAssignment,
    onSettled: invalidate,
  });

  return { create, update, remove };
}
