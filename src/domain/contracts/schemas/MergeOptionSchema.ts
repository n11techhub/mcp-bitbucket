import { z } from 'zod';

export const MergeOptionSchema = z.object({
  message: z.string().optional().describe('Merge commit message'),
  strategy: z.enum(['merge-commit', 'squash', 'fast-forward']).optional().describe('Merge strategy to use')
});

export type MergeOptionType = z.infer<typeof MergeOptionSchema>;
