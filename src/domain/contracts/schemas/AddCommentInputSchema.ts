import { z } from 'zod';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';
import { CommentOptionSchema } from './CommentOptionSchema.js';

export const AddCommentInputSchema = z.object({
  ...GetPullRequestInputSchema.shape,
  ...CommentOptionSchema.shape,
});

export type AddCommentInput = z.infer<typeof AddCommentInputSchema>;
