import {z} from "zod";

export const ListBranchesInputSchema = z.object({
    workspaceSlug: z.string().describe('Slug of the workspace/project.'),
    repoSlug: z.string().describe('Slug of the repository.'),
    query: z.string().optional().describe('Optional filter text to find branches by name.'),
    sort: z.string().optional().describe('Optional ordering key (e.g., MODIFICATION, NAME).')
});

export type ListBranchesInputType = z.infer<typeof ListBranchesInputSchema>;
