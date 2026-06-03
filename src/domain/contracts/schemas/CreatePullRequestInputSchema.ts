import { z } from 'zod/v3';

const PROJECT_KEY_PATTERN = /^[A-Z0-9_-]+$/i;
const REPO_SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;
const BRANCH_REF_PATTERN = /^[A-Za-z0-9._/-]+$/;

export const CreatePullRequestInputSchema = z.object({
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
  title: z.string().min(1).max(300).describe('PR title'),
  description: z.string().max(50000).optional().describe('PR description'),
  sourceBranch: z.string()
      .min(1)
      .max(255)
      .regex(BRANCH_REF_PATTERN, 'Invalid source branch format')
      .describe('Source branch name'),
  targetBranch: z.string()
      .min(1)
      .max(255)
      .regex(BRANCH_REF_PATTERN, 'Invalid target branch format')
      .describe('Target branch name'),
  reviewers: z.array(z.string().min(1).max(255)).max(50).optional().describe('List of reviewer usernames')
});

export type CreatePullRequestInput = z.infer<typeof CreatePullRequestInputSchema>;
