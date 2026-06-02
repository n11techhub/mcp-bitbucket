import { z } from 'zod/v3';
import { ListWorkspacesInputSchema } from '../schemas/ListWorkspacesInputSchema.js';

export type ListWorkspacesInput = z.infer<typeof ListWorkspacesInputSchema>;
