import {z} from "zod/v3";

export const GetFileInputSchema = z.object({
    workspaceSlug: z.string().describe('Slug of the workspace/project.'),
    repoSlug: z.string().describe('Slug of the gateway.'),
    filePath: z.string().describe('Full path to the file within the gateway.'),
    revision: z.string().optional().describe('Optional revision (branch, tag, or commit hash) to get the file from.'),
});

export type GetFileInputType = z.infer<typeof GetFileInputSchema>;
