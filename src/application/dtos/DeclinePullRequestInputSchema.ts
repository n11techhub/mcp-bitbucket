import { z } from 'zod';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';

export const DeclinePullRequestInputSchema = GetPullRequestInputSchema.extend({
  message: z.string().optional().describe('Reason for declining')
});

export type DeclinePullRequestInput = z.infer<typeof DeclinePullRequestInputSchema>;
