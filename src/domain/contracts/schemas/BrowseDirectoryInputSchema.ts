import { z } from 'zod';

const PROJECT_KEY_PATTERN = /^[A-Z0-9_-]+$/i;

export const BrowseDirectoryInputSchema = z.object({
    workspaceSlug: z.string()
        .min(1, 'Workspace slug cannot be empty')
        .max(255, 'Workspace slug too long')
        .regex(PROJECT_KEY_PATTERN, 'Invalid workspace slug format. Only alphanumeric characters, underscores, and hyphens are allowed.')
        .describe('Slug of the workspace/project.'),
    repoSlug: z.string()
        .min(1, 'Repository slug cannot be empty')
        .max(255, 'Repository slug too long')
        .describe('Slug of the repository.'),
    path: z.string()
        .max(1000, 'Path too long')
        .refine(
            (val) => !val || !val.includes('..'),
            { message: 'Path cannot contain ".." (path traversal attempt detected)' }
        )
        .refine(
            // eslint-disable-next-line no-control-regex
            (val) => !val || !/[\x00-\x1F]/.test(val),
            { message: 'Path cannot contain control characters' }
        )
        .optional()
        .describe('Path to the directory. Omit or use empty string, ".", or "/" for root directory.'),
    revision: z.string()
        .optional()
        .describe('Optional revision (branch, tag, or commit hash) to browse from.'),
});

export type BrowseDirectoryInputType = z.infer<typeof BrowseDirectoryInputSchema>;
