import { z } from 'zod';

export const tournamentFormSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên giải đấu'),
  buyIn: z.number().min(0, 'Phí tham gia phải lớn hơn hoặc bằng 0'),
  capacity: z.number().int().min(2, 'Sức chứa phải ít nhất là 2'),
  status: z.enum(['draft', 'published', 'running', 'completed']),
  startAt: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
});
