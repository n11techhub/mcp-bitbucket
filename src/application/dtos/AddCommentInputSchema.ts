import { z } from 'zod';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';
import { CommentOptionSchema } from './CommentOptionSchema.js';

// Combines Pull Request identification with comment details
export const AddCommentInputSchema = GetPullRequestInputSchema.merge(CommentOptionSchema);

export type AddCommentInput = z.infer<typeof AddCommentInputSchema>;
