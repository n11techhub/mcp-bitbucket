import { z } from 'zod';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';
import { MergeOptionSchema } from './MergeOptionSchema.js';

export const MergePullRequestInputSchema = GetPullRequestInputSchema.merge(MergeOptionSchema);

export type MergePullRequestInput = z.infer<typeof MergePullRequestInputSchema>;
