import {z} from "zod";

export const AddBranchInputSchema = z.object({
    workspaceSlug: z.string().describe('Slug of the workspace/project.'),
    repoSlug: z.string().describe('Slug of the repository.'),
    newBranchName: z.string().describe('Name for the new branch.'),
    sourceBranchOrCommit: z.string().optional().describe('Optional source branch name or commit ID to create the new branch from. Defaults to the repository\'s default branch if not specified.'),
});