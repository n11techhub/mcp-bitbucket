import { z } from 'zod';
import { ListWorkspacesInputSchema } from '../../application/dtos/ListWorkspacesInputSchema.js';

// Type is inferred from ListWorkspacesInputSchema in dtos
export type ListWorkspacesInput = z.infer<typeof ListWorkspacesInputSchema>;