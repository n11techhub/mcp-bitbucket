import { z } from 'zod';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';

export const GetDiffInputSchema = GetPullRequestInputSchema.extend({
  contextLines: z.number().optional().describe('Number of context lines')
});

export type GetDiffInput = z.infer<typeof GetDiffInputSchema>;
