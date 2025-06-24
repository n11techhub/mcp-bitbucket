import { z } from 'zod';
import { GetPullRequestInputSchema } from '../schemas/GetPullRequestInputSchema.js';

export type PullRequestParams = z.infer<typeof GetPullRequestInputSchema>;
