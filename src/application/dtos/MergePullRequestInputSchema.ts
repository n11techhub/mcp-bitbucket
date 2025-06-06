import { z } from 'zod';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';
import { MergeOptionSchema } from './MergeOptionSchema.js';

// Combines Pull Request identification (project, repo, prId) with merge-specific options (message, strategy)
export const MergePullRequestInputSchema = GetPullRequestInputSchema.merge(MergeOptionSchema);

export type MergePullRequestInput = z.infer<typeof MergePullRequestInputSchema>;
