import { z } from 'zod';
import { GetPullRequestInputSchema } from './GetPullRequestInputSchema.js';
import { CommentOptionSchema } from './CommentOptionSchema.js';

export const AddCommentInputSchema = GetPullRequestInputSchema.merge(CommentOptionSchema);

export type AddCommentInput = z.infer<typeof AddCommentInputSchema>;
