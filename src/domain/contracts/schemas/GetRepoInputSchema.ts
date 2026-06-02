import {z} from "zod/v3";

export const GetRepoInputSchema = z.object({
    workspaceSlug: z.string().describe('Slug of the workspace/project.'),
    repoSlug: z.string().describe('Slug of the gateway.'),
});

export type GetRepoInputType = z.infer<typeof GetRepoInputSchema>;
