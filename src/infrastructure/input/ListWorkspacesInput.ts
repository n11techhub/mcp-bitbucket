import { z } from 'zod';
import { ListWorkspacesInputSchema } from '../../application/dtos/ListWorkspacesInputSchema.js';

export type ListWorkspacesInput = z.infer<typeof ListWorkspacesInputSchema>;