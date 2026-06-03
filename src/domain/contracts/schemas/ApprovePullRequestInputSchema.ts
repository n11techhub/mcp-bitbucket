import { z } from 'zod/v3';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';

export const ApprovePullRequestInputSchema = GetPullRequestInputSchema.extend({
    version: z.number().int().nonnegative().optional().describe('Optional pull request version for optimistic locking.')
});

export type ApprovePullRequestInput = z.infer<typeof ApprovePullRequestInputSchema>;
