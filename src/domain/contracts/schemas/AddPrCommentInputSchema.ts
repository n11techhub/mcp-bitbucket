import {z} from "zod/v3";
import { InlineCommentAnchorSchema } from './InlineCommentAnchorSchema.js';

const PROJECT_KEY_PATTERN = /^[A-Z0-9_-]+$/i;
const REPO_SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;

export const AddPrCommentInputSchema = z.object({
    workspaceSlug: z.string()
        .min(1)
        .max(255)
        .regex(PROJECT_KEY_PATTERN, 'Invalid workspace/project format')
        .describe('Slug of the workspace/project.'),
    repoSlug: z.string()
        .min(1)
        .max(255)
        .regex(REPO_SLUG_PATTERN, 'Invalid repository format')
        .describe('Slug of the gateway.'),
    prId: z.number().int().positive().describe('Numeric ID of the pull request.'),
    content: z.string().min(1).max(20000).describe('The text content of the comment.'),
    parentId: z.number().int().positive().optional().describe('Optional ID of the parent comment if this is a reply.'),
    inline: InlineCommentAnchorSchema.optional().describe('Optional details for an inline comment on a specific line in a file.')
});

export type AddPrCommentInputType = z.infer<typeof AddPrCommentInputSchema>;
