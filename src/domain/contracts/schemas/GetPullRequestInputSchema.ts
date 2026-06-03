import { z } from 'zod/v3';

const PROJECT_KEY_PATTERN = /^[A-Z0-9_-]+$/i;
const REPO_SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;

export const GetPullRequestInputSchema = z.object({
  project: z.string()
      .min(1)
      .max(255)
      .regex(PROJECT_KEY_PATTERN, 'Invalid project format')
      .optional()
      .describe('Bitbucket project key'),
  repository: z.string()
      .min(1)
      .max(255)
      .regex(REPO_SLUG_PATTERN, 'Invalid repository format')
      .describe('Repository slug'),
  prId: z.number().int().positive().describe('Pull request ID')
});

export type GetPullRequestInput = z.infer<typeof GetPullRequestInputSchema>;
