import { z } from 'zod/v3';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';
import { MergeOptionSchema } from './MergeOptionSchema.js';

export const MergePullRequestInputSchema = GetPullRequestInputSchema.merge(MergeOptionSchema);

export type MergePullRequestInput = z.infer<typeof MergePullRequestInputSchema>;
