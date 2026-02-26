import { z } from 'zod';

// Regex pattern for valid Bitbucket project keys: alphanumeric, underscore, hyphen
const PROJECT_KEY_PATTERN = /^[A-Z0-9_-]+$/i;

export const ListRepositoriesInputSchema = z.object({
  workspaceSlug: z.string()
    .min(1, 'Workspace slug cannot be empty')
    .max(255, 'Workspace slug too long')
    .regex(PROJECT_KEY_PATTERN, 'Invalid workspace slug format. Only alphanumeric characters, underscores, and hyphens are allowed.')
    .optional()
    .describe('Slug of the workspace/project.'),
  projectKey: z.string()
    .min(1, 'Project key cannot be empty')
    .max(255, 'Project key too long')
    .regex(PROJECT_KEY_PATTERN, 'Invalid project key format. Only alphanumeric characters, underscores, and hyphens are allowed.')
    .optional()
    .describe('Key of the project.'),
  query: z.string()
    .max(500, 'Query too long')
    .optional()
    .describe('Filter repositories by name.'),
  role: z.string()
    .max(100, 'Role too long')
    .optional()
    .describe('Filter repositories by user role (e.g., REPO_READ, REPO_WRITE, REPO_ADMIN).')
});

export type ListRepositoriesInputType = z.infer<typeof ListRepositoriesInputSchema>;
