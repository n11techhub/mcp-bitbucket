import { z } from 'zod';
import { CreatePullRequestInputSchema } from '../../application/dtos/CreatePullRequestInputSchema';

export type PullRequestInput = z.infer<typeof CreatePullRequestInputSchema>;