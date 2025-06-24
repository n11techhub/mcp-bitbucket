import { z } from 'zod';
import { CreatePullRequestInputSchema } from '../schemas/CreatePullRequestInputSchema.js';

export type PullRequestInput = z.infer<typeof CreatePullRequestInputSchema>;
