import {z} from "zod";

export const InlineCommentAnchorSchema = z.object({
    path: z.string().describe('Path to the file being commented on.'),
    line: z.number().int().positive().describe('Line number for the comment anchor.'),
    lineType: z.enum(['ADDED', 'REMOVED', 'CONTEXT']).optional().describe('The type of the line being commented on (e.g., ADDED, CONTEXT).'),
    fileType: z.enum(['FROM', 'TO']).optional().describe('The side of the diff the comment is on (FROM for source, TO for destination). Defaults to TO if not specified for line comments.')
});