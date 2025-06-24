import { z } from 'zod';

export const GetPullRequestInputSchema = z.object({
  project: z.string().optional().describe('Bitbucket project key'),
  repository: z.string().describe('Repository slug'),
  prId: z.number().describe('Pull request ID')
});

export type GetPullRequestInput = z.infer<typeof GetPullRequestInputSchema>;
