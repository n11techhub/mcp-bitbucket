import { z } from 'zod';

export const ListRepositoriesInputSchema = z.object({
  workspaceSlug: z.string().optional().describe('Slug of the workspace/project.'),
  projectKey: z.string().optional().describe('Key of the project.'),
  query: z.string().optional().describe('Filter repositories by name.'),
  role: z.string().optional().describe('Filter repositories by user role (e.g., REPO_READ, REPO_WRITE, REPO_ADMIN).')
});

export type ListRepositoriesInputType = z.infer<typeof ListRepositoriesInputSchema>;
