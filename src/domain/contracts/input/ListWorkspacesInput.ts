import { z } from 'zod';
import { ListWorkspacesInputSchema } from '../schemas/ListWorkspacesInputSchema.js';

export type ListWorkspacesInput = z.infer<typeof ListWorkspacesInputSchema>;
