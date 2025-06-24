import {z} from "zod";
import { InlineCommentAnchorSchema } from './InlineCommentAnchorSchema.js';

export const AddPrCommentInputSchema = z.object({
    workspaceSlug: z.string().describe('Slug of the workspace/project.'),
    repoSlug: z.string().describe('Slug of the repository.'),
    prId: z.number().int().positive().describe('Numeric ID of the pull request.'),
    content: z.string().describe('The text content of the comment.'),
    parentId: z.number().int().positive().optional().describe('Optional ID of the parent comment if this is a reply.'),
    inline: InlineCommentAnchorSchema.optional().describe('Optional details for an inline comment on a specific line in a file.')
});

export type AddPrCommentInputType = z.infer<typeof AddPrCommentInputSchema>;
