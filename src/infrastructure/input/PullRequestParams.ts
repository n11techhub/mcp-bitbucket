import { z } from 'zod';
import { GetPullRequestInputSchema } from '../../application/dtos/GetPullRequestInputSchema.js';

export type PullRequestParams = z.infer<typeof GetPullRequestInputSchema>;