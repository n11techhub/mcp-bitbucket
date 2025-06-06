import { z } from 'zod';
import { GetPullRequestInputSchema } from '../../application/dtos/GetPullRequestInputSchema';

export type PullRequestParams = z.infer<typeof GetPullRequestInputSchema>;