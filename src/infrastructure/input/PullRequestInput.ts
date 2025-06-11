import { z } from 'zod';
import { CreatePullRequestInputSchema } from '../../application/dtos/CreatePullRequestInputSchema.js';

export type PullRequestInput = z.infer<typeof CreatePullRequestInputSchema>;