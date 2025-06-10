import { z } from 'zod';

export const CreatePullRequestInputSchema = z.object({
  project: z.string().optional().describe('Bitbucket project key'), 
  repository: z.string().describe('Repository slug'),
  title: z.string().describe('PR title'),
  description: z.string().optional().describe('PR description'), 
  sourceBranch: z.string().describe('Source branch name'),
  targetBranch: z.string().describe('Target branch name'),
  reviewers: z.array(z.string()).optional().describe('List of reviewer usernames')
});

export type CreatePullRequestInput = z.infer<typeof CreatePullRequestInputSchema>;
