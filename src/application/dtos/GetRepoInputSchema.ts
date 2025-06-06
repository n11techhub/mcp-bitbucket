import {z} from "zod";

export const GetRepoInputSchema = z.object({
    workspaceSlug: z.string().describe('Slug of the workspace/project.'),
    repoSlug: z.string().describe('Slug of the repository.'),
});

export type GetRepoInputType = z.infer<typeof GetRepoInputSchema>;