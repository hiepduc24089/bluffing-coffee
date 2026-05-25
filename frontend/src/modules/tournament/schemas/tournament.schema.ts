import { z } from 'zod';

export const tournamentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  buyIn: z.number().min(0, 'Buy-in must be zero or greater'),
  capacity: z.number().int().min(2, 'Capacity must be at least 2'),
  status: z.enum(['draft', 'published', 'running', 'completed']),
  startAt: z.string().min(1, 'Start time is required'),
});
