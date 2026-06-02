import { z } from 'zod/v3';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';

export const DeclinePullRequestInputSchema = GetPullRequestInputSchema.extend({
  message: z.string().optional().describe('Reason for declining')
});

export type DeclinePullRequestInput = z.infer<typeof DeclinePullRequestInputSchema>;
