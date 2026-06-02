import { z } from 'zod/v3';
import { GetPullRequestInputSchema } from '../schemas/GetPullRequestInputSchema.js';

export type PullRequestParams = z.infer<typeof GetPullRequestInputSchema>;
