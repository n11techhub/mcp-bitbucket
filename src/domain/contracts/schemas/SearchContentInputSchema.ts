import { z } from 'zod';

export const SearchContentInputSchema = z.object({
  workspaceSlug: z.string().describe('Slug of the workspace/project to search within.'),
  query: z.string().describe('The search query string.'),
  scope: z.string().optional().describe('Scope of the search (e.g., specific repository slug within the workspace).'),
  language: z.string().optional().describe('Filter by programming language (e.g., java, python).'),
  extension: z.string().optional().describe('Filter by file extension (e.g., xml, ts).')
});

export type SearchContentInputType = z.infer<typeof SearchContentInputSchema>;
