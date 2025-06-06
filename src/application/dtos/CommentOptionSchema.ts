import { z } from 'zod';

export const CommentOptionSchema = z.object({
  text: z.string().describe('Comment text'),
  parentId: z.number().optional().describe('Parent comment ID for replies')
});

export type CommentOptionType = z.infer<typeof CommentOptionSchema>;
