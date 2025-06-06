import { z } from 'zod';
import { CreatePullRequestInputSchema } from '../../application/dtos/CreatePullRequestInputSchema';

// This type is now directly inferred and exported by CreatePullRequestInputSchema.ts
// We keep this file for now if other parts of the infrastructure layer specifically import PullRequestInput from this path.
// Ideally, they would import CreatePullRequestInput from the DTOs or this would be an alias.
export type PullRequestInput = z.infer<typeof CreatePullRequestInputSchema>;