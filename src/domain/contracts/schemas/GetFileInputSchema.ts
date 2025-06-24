import {z} from "zod";

export const GetFileInputSchema = z.object({
    workspaceSlug: z.string().describe('Slug of the workspace/project.'),
    repoSlug: z.string().describe('Slug of the repository.'),
    filePath: z.string().describe('Full path to the file within the repository.'),
    revision: z.string().optional().describe('Optional revision (branch, tag, or commit hash) to get the file from.'),
});

export type GetFileInputType = z.infer<typeof GetFileInputSchema>;
