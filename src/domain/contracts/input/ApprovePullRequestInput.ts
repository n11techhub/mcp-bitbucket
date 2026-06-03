import { z } from 'zod/v3';
import { ApprovePullRequestInputSchema } from '../schemas/ApprovePullRequestInputSchema.js';

export interface ApprovePullRequestInput extends z.infer<typeof ApprovePullRequestInputSchema> {}

